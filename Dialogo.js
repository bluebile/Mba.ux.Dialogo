Ext.define('Mba.ux.Dialogo', {

	alternateClassName : 'Mba.Dialogo',
	statics : {

		_tipos : {
			ALERT 	: 1,
			TOAST 	: 2,
			CONFIRM : 3,
			PROMPT	: 4,
			SHOWCASE: 5,
			LOADING : 6,
            NOTIFICATION: 7
		},

		_clsTipos : {
			ALERT : 'dialogoAlert',
			TOAST : 'dialogoToast',
			CONFIRM : 'dialogoConfirm',
			PROMPT : 'dialogoPrompt',
			SHOWCASE: 'dialogoShowcase',
			LOADING : 'dialogoLoading',
            NOTIFICATION: 'dialogoNotification'
		},

		TIMEOUT : {
			LONG 	: 2000,
			SHORT 	: 1000
		},

		_closeAll : true,

		_dialogosAbertos: [],

		_timeoutList : [],

		tipo : 0,


        bloquearTela: function(callback, scope) {
            if (!Ext.application.maskBody) {
                Ext.application.maskBody = Ext.create('Ext.Mask', {
                    renderTo: Ext.getBody()
                });
                }
                Ext.application.maskBody.show();
        },

        liberarTela: function() {
            Ext.application.maskBody && Ext.application.maskBody.hide();
        },

		_create :function ( options ) {

			if( Mba.Dialogo._closeAll ){
				Mba.Dialogo._hide();
			}

			var arrayCls = [ 'dialogo', options.clsTipo ];
			if ( options.cls && Ext.isString( options.cls ) ) {
				arrayCls.push( options.cls );
			}

			Mba.Dialogo.tipo = options.tipo;

			var dialogo = Ext.create('Ext.Container', {
				itemId : 'Mba_Dialogo',
				renderTo: Ext.getBody(),
				cls : arrayCls,
				//layout : 'vbox',
				scrollable : options.scrollable || false,
				centered: true,
				listeners : {
					hide : function (dialogo) {
						console.log('hide listened!');
						dialogo.destroy();
					}
				}
			});

			var itensDialogo = [];
			//loading
			if(options.tipo == Mba.Dialogo._tipos.LOADING) {

				dialogo.addCls('roundedCorners-8');

				dialogo.setLayout({
					type: 'vbox',
					pack: 'center',
					align: 'center'
				});

				itensDialogo = [{
					xtype : 'image',
					baseCls : 'img_loading_popup',
					scrollable: null
				}, {
					xtype : 'label',
					html : '<div class="spinner"></div>'
				}];

			}

            console.log('btnFechar');
            console.log(options.btnFechar);

			if( options.btnFechar ) { // adicionar container com botao
				var tituloDialogo = [];
				if(options.titulo) {
                    if (options.acao) {
                        tituloDialogo.push({
                            xtype: 'button',
                            ui: 'plain',
                            cls: 'tituloDialogo',
                            html: options.titulo,
                            flex: 1,
                            listeners: {
                                tap: function(){
                                    options.acao();
                                    Mba.Dialogo._hide( dialogo );
                                    Mba.Dialogo._clearToastsTimers();
                                }
                            }
                        });
                    } else {
                        tituloDialogo.push({
                            xtype : 'label',
                            cls : 'tituloDialogo',
                            html : options.titulo,
                            flex : 1
                        });
                    }
				}
				tituloDialogo.push({
					xtype: 'button',
					ui: 'plain',
					cls: ['botaoFecharDialogo'],
					iconCls: 'iconeFecharDialogo',
					docked: 'right',
					listeners: {
						tap: function(){
							Mba.Dialogo._hide( dialogo );
							Mba.Dialogo._clearToastsTimers();
							if(options.callbackFechar) options.callbackFechar();
						}
					}
				});

				itensDialogo.push({
					xtype : 'container',
		        	cls : [ 'areaTituloDialogo' ],
		        	layout : {
		        		type: 'hbox'
		        	},
		        	items : tituloDialogo
				});
			} else { // sem botao de fechar
				if ( options.titulo ) {
					itensDialogo.push({
						xtype : 'container',
			        	cls : [ 'areaTituloDialogo' ],
			        	items : [{
			        		xtype : 'label',
			        		cls : 'tituloDialogo',
			        		html : options.titulo
			        	}
                        ]
					});
				}
			};

			var handlerBotaoOK = null;

			// customView
			if ( options.customView ) {

				itensDialogo.push( options.customView );

			} else {

				// mensagem
				if ( options.mensagem ) {

					itensDialogo.push({
			        	 xtype : 'container',
			        	 cls : [ 'areaMensagemDialogo' ],
			        	 items : [
		        	          {
		        	        	  xtype : 'label',
		        	        	  cls : 'mensagemDialogo',
		        	        	  html : options.mensagem
		        	          }
	        	         ]
			         });
				}

				// prompt
				if ( options.tipo == Mba.Dialogo._tipos.PROMPT ) {

					itensDialogo.push({
			        	 xtype : 'container',
			        	 cls : [ 'areaPromptDialogo' ],
			        	 items : [
		        	          {
		        	        	  xtype : options.xtypeTextfield,
		        	        	  cls : ['promptDialogo','Mba-linhabaixofield']
		        	          }
	        	         ]
			         });

					handlerBotaoOK = function () {
						console.log('botaoOkDialogo, options.funcaoOK = ' + options.funcaoOK);

						var valor = dialogo.down( options.xtypeTextfield ).getValue();

						var deveFechar = options.funcaoOK( valor );

						console.log('botaoOkDialogo, deveFechar = ' + deveFechar);

						if ( deveFechar ) Mba.Dialogo._hide( dialogo );
					};

				}

			}

			// botoes
			if ( options.tipo != Mba.Dialogo._tipos.TOAST &&
			     options.tipo != Mba.Dialogo._tipos.SHOWCASE &&
			     options.tipo != Mba.Dialogo._tipos.LOADING) {

				handlerBotaoOK = handlerBotaoOK ? handlerBotaoOK : function () {
					console.log('botaoOkDialogo, options.funcaoOK = ' + options.funcaoOK);

					var deveFechar = options.funcaoOK();

					console.log('botaoOkDialogo, deveFechar = ' + deveFechar);

					if ( deveFechar ) Mba.Dialogo._hide( dialogo );
				};

				var botoes = [{
					xtype : 'button',
					ui: 'plain',
					cls : ['botaoOkDialogo'],
					text : options.textoOK,
					right: 0,
					handler : handlerBotaoOK
				}];

				if ( options.tipo == Mba.Dialogo._tipos.CONFIRM
						|| options.tipo == Mba.Dialogo._tipos.PROMPT ) {
					botoes.push({
						xtype : 'button',
						ui: 'plain',
						cls : ['botaoCancelarDialogo'],
						text : options.textoCancelar,
						handler : function() {
							console.log('botaoCancelarDialogo, options.funcaoCancelar = ' + options.funcaoCancelar);

							var deveFechar = options.funcaoCancelar();

							console.log('botaoCancelarDialogo, deveFechar = ' + deveFechar);

							if ( deveFechar ) Mba.Dialogo._hide( dialogo );
						}
					});
				}


				if(options.btnOK) {
					itensDialogo.push({
						xtype : 'container',
			        	cls : [ 'areaBotoesDialogo' ],
                        docked: 'bottom',
			        	items : botoes
			        });
				}

			} else {// toast, showcase ou loading
				// essas classes sao mantidas para compatilidade
				// as classes para todos os tipos estao em: Mba.Dialogo._clsTipos
				var cls = '';
				if(options.tipo == Mba.Dialogo._tipos.TOAST) {
					cls = 'toast';
				} else if( options.tipo == Mba.Dialogo._tipos.LOADING ) {
					cls = 'loading';
				} else {
					cls = 'showcase';
				}

				dialogo.addCls( cls );
			}

			dialogo.setItems( itensDialogo );
			return dialogo;

		},

		_show : function ( dialogo, bloquearTela) {

            if (bloquearTela)
			   this.bloquearTela();

			dialogo.removeCls('fadeOut');
			dialogo.addCls('fadeIn');

			if( Mba.Dialogo._dialogosAbertos ){
				for( var i=0 ; i < Mba.Dialogo._dialogosAbertos.length; i++ ){
					var dialogoAberto = Mba.Dialogo._dialogosAbertos[i];
					dialogoAberto.setMasked( true );
				}
			}
			var length = Mba.Dialogo._dialogosAbertos.length;
			Mba.Dialogo._dialogosAbertos[ length ] = dialogo;
			dialogo.show();
		},

		_hide : function ( dialogo ) {
            var me=this;
			var dialogoId = null;
			if ( dialogo ) {
				dialogoId = dialogo.getId();
				// problemas com o hide, as vezes não efetua o efeito e nem invoca o listener
				// dialogo.hide();
				dialogo.removeCls('fadeIn');
				dialogo.addCls('fadeOut');

				var lengthDialogosAbertos = Mba.Dialogo._dialogosAbertos.length;

				//remover o ultimo dialogo da lista
				Mba.Dialogo._dialogosAbertos.splice( lengthDialogosAbertos -1 , 1);
				lengthDialogosAbertos = lengthDialogosAbertos - 1;

				var fecharELiberar = function(){
					dialogo.destroy();
					if( lengthDialogosAbertos == 0) {
						me.liberarTela();
					}
				};

				var liberarDialogoSeHouver = function(){
					if( Mba.Dialogo._dialogosAbertos && lengthDialogosAbertos > 0){
						var dialogoAberto = Mba.Dialogo._dialogosAbertos[ lengthDialogosAbertos - 1 ];
						if (dialogoAberto)
							dialogoAberto.setMasked( false );
					}
				};

				setTimeout(function(){
					liberarDialogoSeHouver();
				},300);

				setTimeout( function() {
					fecharELiberar();
				}, 510 ); // a transicao de fade tem 500ms

			} else {
				var dialogos = Ext.ComponentQuery.query( '#Mba_Dialogo' );
				var d;
				for (var i = 0; i < dialogos.length; i++) {
					d = dialogos[i];
					if ( dialogoId == d.getId() ) {
						continue;
					}
					d.destroy();
				}
				this.liberarTela();
				Mba.Dialogo._dialogosAbertos = [];
			}

		},

		_mergeMsgOuOpcoes : function ( opcoes, mensagemOuOpcoes) {
			if ( Ext.isString( mensagemOuOpcoes ) ) {
				opcoes.mensagem = mensagemOuOpcoes;
			} else { // deve ser objeto
				opcoes = Ext.Object.merge( {}, opcoes, mensagemOuOpcoes );
			}

			return opcoes;
		},

		/**
		 * closeAll - se TRUE, antes de abrir um novo Dialogo, os anteriores serão fechados
		 */

		closeAllBeforeOpen: function ( closeAll ){
			Mba.Dialogo._closeAll = closeAll;
		},

		/**
		 *
		 * mensagemOuOpcoes - string com mensagem ou objeto com opções:
		 *
		 * {
		 * 	mensagem,
		 *  timeout,
		 *  cls - cls adicionado no dialogo (opcional)
		 * }
		 *
		 */
		toast : function( mensagemOuOpcoes, callback ) {

			Mba.Dialogo._clearToastsTimers();

			var options = {
				mensagem : ' ',
				timeout : Mba.Dialogo.TIMEOUT.SHORT
			};

			options = Mba.Dialogo._mergeMsgOuOpcoes( options, mensagemOuOpcoes );

			options.tipo = Mba.Dialogo._tipos.TOAST;
			options.clsTipo = Mba.Dialogo._clsTipos.TOAST;

			var dialogo = Mba.Dialogo._create( options );

			Mba.Dialogo._show( dialogo, true );

			var id = Ext.Function.defer( function() {
				Mba.Dialogo._hide( dialogo );
                if (callback)
                    callback();
			}, options.timeout );

			Mba.Dialogo._timeoutList.push( id );



			return dialogo;

		},

        /**
         *
         * mensagemOuOpcoes - string com mensagem ou objeto com opções:
         *
         * {
		 * 	mensagem,
		 *  timeout,
		 *  cls - cls adicionado no dialogo (opcional)
		 * }
         *
         */
        notification : function( mensagemOuOpcoes ) {

            Mba.Dialogo._clearToastsTimers();

            var options = {
                mensagem : ' ',
                timeout : Mba.Dialogo.TIMEOUT.LONG

            };

            options = Mba.Dialogo._mergeMsgOuOpcoes( options, mensagemOuOpcoes );

            options.tipo = Mba.Dialogo._tipos.NOTIFICATION;
            options.clsTipo = Mba.Dialogo._clsTipos.NOTIFICATION;

            var dialogo = Mba.Dialogo._create( options );

            Mba.Dialogo._show( dialogo, false );

            var id = Ext.Function.defer( function() {
                Mba.Dialogo._hide( dialogo );
            }, options.timeout );

            Mba.Dialogo._timeoutList.push( id );

            return dialogo;

        },
		_clearToastsTimers : function () {

			for (var i = 0; i < Mba.Dialogo._timeoutList.length; i++) {
				clearTimeout( Mba.Dialogo._timeoutList[i] );
			}

			Mba.Dialogo._timeoutList = [];

		},

		/**
		 * DEPRECIADO: use o loading
		 */

		showLoading : function( opcoes ){
			Mba.Dialogo.loading( opcoes );
		},

		/**
		 * opcoes {
		 * 	 cls - cls adicionado no dialogo (opcional)
		 * }
		 */
		loading : function( opcoes ) {

			var options = {};

			options = Mba.Dialogo._mergeMsgOuOpcoes( options, opcoes );

			options.tipo = Mba.Dialogo._tipos.LOADING;
			options.clsTipo = Mba.Dialogo._clsTipos.LOADING;

			var loading = Mba.Dialogo._create( options );

			Mba.Dialogo._show(loading, true);

			return loading;
		},

		/**
		 *
		 * mensagemOuOpcoes - string com mensagem ou objeto com opções:
		 *
		 * {
		 * 	mensagem,
		 * 	titulo,
		 *  btnOK - return true/false se tem ou não um action button,
		 *  btnFechar - return true/false se tem ou não um botão X(fechar),
		 * 	textoOK,
		 * 	funcaoOK - return true se deve fechar o dialogo, senão false,
		 * 	customView - substitui a mensagem,
		 *  cls - cls adicionado no dialogo (opcional)
		 * }
		 *
		 */
		alert : function ( mensagemOuOpcoes ) {

			var options = {
				mensagem : null,
				titulo : null,
				btnOK : true,
				btnFechar : false,
				textoOK : MbaLocale.get('mensagem.ok'),
				funcaoOK : function(){ return true; }
			};

			options = Mba.Dialogo._mergeMsgOuOpcoes( options, mensagemOuOpcoes );

			options.tipo = Mba.Dialogo._tipos.ALERT;
			options.clsTipo = Mba.Dialogo._clsTipos.ALERT;

			var dialogo = Mba.Dialogo._create( options );
			Mba.Dialogo._show(dialogo, true);

			return dialogo;
		},

		/**
		 *
		 * {
		 * 	mensagem,
		 * 	titulo,
		 *  btnOK - return true/false se tem ou não um action button,
		 *  btnFechar - return true/false se tem ou não um botão X(fechar),
		 * 	textoOK,
		 * 	funcaoOK - return true se deve fechar o dialogo, senão false,
		 *  textoCancelar,
		 *  funcaoCancelar  - return true se deve fechar o dialogo, senão false,
		 * 	xtypeTextfield - substitui o xtype do textfield,
		 * 	customView - item substitui a mensagem e textfield,
		 *  cls - cls adicionado no dialogo (opcional)
		 * }
		 *
		 */
		prompt : function ( opcoes ) {

			var options = {
				mensagem : null,
				titulo : null,
				btnOK : opcoes.btnOk || false,
				btnFechar : false,
				textoOK : opcoes.textoOK || MbaLocale.get('mensagem.ok'),
				funcaoOK : function(){ return true; },
				textoCancelar : opcoes.textoCancelar || MbaLocale.get('mensagem.cancelar'),
				funcaoCancelar : function(){ return true; },
				xtypeTextfield : 'textfield'
			};


			options = Mba.Dialogo._mergeMsgOuOpcoes( options, opcoes );

			options.tipo = Mba.Dialogo._tipos.PROMPT;
			options.clsTipo = Mba.Dialogo._clsTipos.PROMPT;

			var dialogo = Mba.Dialogo._create( options );
			Mba.Dialogo._show(dialogo, true);

			return dialogo;
		},

		/**
		 * mensagemOuOpcoes - string com mensagem ou objeto com opções:
		 *
		 * {
		 * 	mensagem,
		 * 	titulo,
		 *  btnOK - return true/false se tem ou não um action button,
		 *  btnFechar - return true/false se tem ou não um botão X(fechar),
		 * 	textoOK,
		 * 	funcaoOK - return true se deve fechar o dialogo, senão false,
		 *  textoCancelar,
		 *  funcaoCancelar - return true se deve fechar o dialogo, senão false,
		 * 	customView - item substitui a mensagem,
		 *  cls - cls adicionado no dialogo (opcional)
		 * }
		 *
		 */
		confirm : function ( mensagemOuOpcoes ) {
			var options = {
				mensagem : null,
				titulo : null,
				btnOK : true,
				btnFechar : false,
				textoOK : MbaLocale.get('mensagem.sim'),
				funcaoOK : function(){ return true; },
				textoCancelar : MbaLocale.get('mensagem.nao'),
				funcaoCancelar : function(){ return true; }
			};

			options = Mba.Dialogo._mergeMsgOuOpcoes( options, mensagemOuOpcoes );

			options.tipo = Mba.Dialogo._tipos.CONFIRM;
			options.clsTipo = Mba.Dialogo._clsTipos.CONFIRM;

			var dialogo = Mba.Dialogo._create( options );
			Mba.Dialogo._show(dialogo, true);

			return dialogo;
		},

		showcase : function ( mensagemOuOpcoes ){
			var options = {};

			options = Mba.Dialogo._mergeMsgOuOpcoes( options, mensagemOuOpcoes );

			options.tipo = Mba.Dialogo._tipos.SHOWCASE;
			options.clsTipo = Mba.Dialogo._clsTipos.SHOWCASE;

			var dialogo = Mba.Dialogo._create( options );
			Mba.Dialogo._show(dialogo, true);

			return dialogo;
		},

		isOpen : function () {

			var dialogos = Ext.ComponentQuery.query('#Mba_Dialogo');
			if ( dialogos && dialogos.length > 0 ) {
				return true;
			}

			return false;
		},

		close : function ( dialogo ) {
			Mba.Dialogo._hide( dialogo );
		}

	}

});
