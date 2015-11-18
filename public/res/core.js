/*globals Markdown, requirejs */
define([
    "underscore",
    "crel",
    // "ace",
    "constants",
    "utils",
    // "settings",
    "eventMgr",
    "shortcutMgr",
    'pagedown-ace',
    'pagedown-light',
    // 'libs/ace_mode',
    // 'ace/requirejs/text!ace/css/editor.css',
    // 'ace/requirejs/text!ace/theme/textmate.css',
    // 'ace/ext/spellcheck',
    // 'ace/ext/searchbox'
], function(_, crel, 
    // ace, 
    constants, utils, eventMgr, shortcutMgr) {

    var core = {};

    window['MD'] = {'eventMgr': eventMgr};

    var insertLinkO = $('<div class="modal fade modal-insert-link"><div class="modal-dialog"><div class="modal-content">'
            + '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
            + '<h4 class="modal-title">' + getMsg('Hyperlink') + '</h4></div>'
            + '<div class="modal-body"><p>' + getMsg('Please provide the link URL and an optional title') + ':</p>'
            + '<div class="input-group"><span class="input-group-addon"><i class="fa fa-link"></i></span><input id="input-insert-link" type="text" class="col-sm-5 form-control" placeholder="http://example.com  ' + getMsg('optional title') + '"></div></div><div class="modal-footer"><a href="#" class="btn btn-default" data-dismiss="modal">' + getMsg('Cancel') + '</a> <a href="#" class="btn btn-primary action-insert-link" data-dismiss="modal">' + getMsg('OK') + '</a></div></div></div></div>');

    var actionInsertLinkO = insertLinkO.find('.action-insert-link');

    // Create ACE editor
    var aceEditor;
    function createAceEditor() {
        aceEditor = ace.edit("wmd-input");
        MD.aceEditor = aceEditor;
        aceEditor.setOption("spellcheck", true);

        // vim
        // aceEditor.setKeyboardHandler("ace/keyboard/vim");

        aceEditor.renderer.setShowGutter(false);
        aceEditor.renderer.setPrintMarginColumn(false);
        aceEditor.renderer.setPadding(constants.EDITOR_DEFAULT_PADDING);
        aceEditor.session.setUseWrapMode(true);
        aceEditor.session.setNewLineMode("unix");
        // aceEditor.session.setMode("libs/ace_mode");
        aceEditor.session.setMode("ace/mode/ace_mode");

        aceEditor.session.$selectLongWords = true;

        // Make bold titles...
        (function(self) {
            function checkLine(currentLine) {
                var line = self.lines[currentLine];
                if(line.length !== 0) {
                    if(line[0].type.indexOf("markup.heading.multi") === 0) {
                        _.each(self.lines[currentLine - 1], function(previousLineObject) {
                            previousLineObject.type = "markup.heading.prev.multi";
                        });
                    }
                }
            }
            function customWorker() {
                // Duplicate from background_tokenizer.js
                if(!self.running) {
                    return;
                }

                var workerStart = new Date();
                var currentLine = self.currentLine;
                var endLine = -1;
                var doc = self.doc;

                while (self.lines[currentLine]) {
                    currentLine++;
                }

                var startLine = currentLine;

                var len = doc.getLength();
                var processedLines = 0;
                self.running = false;
                while (currentLine < len) {
                    self.$tokenizeRow(currentLine);
                    endLine = currentLine;
                    do {
                        checkLine(currentLine); // benweet
                        currentLine++;
                    } while (self.lines[currentLine]);

                    // only check every 5 lines
                    processedLines++;
                    if((processedLines % 5 === 0) && (new Date() - workerStart) > 20) {
                        self.running = setTimeout(customWorker, 20); // benweet
                        self.currentLine = currentLine;
                        return;
                    }
                }
                self.currentLine = currentLine;

                if(startLine <= endLine) {
                    self.fireUpdateEvent(startLine, endLine);
                }
            }
            self.$worker = function() {
                self.lines.splice(0, self.lines.length);
                self.states.splice(0, self.states.length);
                self.currentLine = 0;
                customWorker();
            };

        })(aceEditor.session.bgTokenizer);

        shortcutMgr.configureAce(aceEditor);
        eventMgr.onAceCreated(aceEditor);
    }

    // 本地缓存
    var localS = {
        get: function(key) {
            if (localStorage) {
                return localStorage.getItem(key);
            }
            return;
        },
        set: function(key, value) {
            value += '';
            if (localStorage) {
                localStorage.setItem(key, value);
            }
        }
    }

    // Create the layout
    var $editorButtonsElt;

    var $navbarElt;
    var $leftBtnElts;
    var $rightBtnElts;
    var $leftBtnDropdown;
    var $rightBtnDropdown;

    // Create the PageDown editor
    var editor;
    var $editorElt;
    var fileDesc;
    var documentContent;
    // var UndoManager = require("ace/undomanager").UndoManager;
    var previewWrapper;
    core.initEditor = function(fileDescParam) {

        if(fileDesc !== undefined) {
            eventMgr.onFileClosed(fileDesc);
        }
        if (!fileDescParam) {
            fileDescParam = {content: ""};
        }
        fileDesc = fileDescParam;
        documentContent = undefined;
        var initDocumentContent = fileDesc.content;

        if(aceEditor !== undefined) {
            aceEditor.setValue(initDocumentContent, -1);
            // 重新设置undo manage
            // aceEditor.getSession().setUndoManager(new ace.UndoManager());
        }
        else {
            $editorElt.val(initDocumentContent);
        }

        // If the editor is already created
        if(editor !== undefined) {
            aceEditor && fileDesc.editorSelectRange && aceEditor.selection.setSelectionRange(fileDesc.editorSelectRange);
            // aceEditor ? aceEditor.focus() : $editorElt.focus();
            editor.refreshPreview();

            MD.$editorElt = $editorElt;

            // 滚动到最顶部, 不然ace editor有问题
            if(window.lightMode) {
                $editorElt.scrollTop(0);
            }
            else {
                _.defer(function() {
                    aceEditor.renderer.scrollToY(0);
                });
            }
            return;
        }

        var $previewContainerElt = $(".preview-container");

        if(window.lightMode) {
            // Store editor scrollTop on scroll event
            $editorElt.scroll(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorScrollTop = $(this).scrollTop();
                }
            });
            // Store editor selection on change
            $editorElt.bind("keyup mouseup", function() {
                if(documentContent !== undefined) {
                    fileDesc.editorStart = this.selectionStart;
                    fileDesc.editorEnd = this.selectionEnd;
                }
            });
        }
        else {
            // Store editor scrollTop on scroll event
            var saveScroll = _.debounce(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorScrollTop = aceEditor.renderer.getScrollTop();
                }
            }, 100);
            aceEditor.session.on('changeScrollTop', saveScroll);
            // Store editor selection on change
            var saveSelection = _.debounce(function() {
                if(documentContent !== undefined) {
                    fileDesc.editorSelectRange = aceEditor.getSelectionRange();
                }
            }, 100);
            aceEditor.session.selection.on('changeSelection', saveSelection);
            aceEditor.session.selection.on('changeCursor', saveSelection);
        }
        // Store preview scrollTop on scroll event
        $previewContainerElt.scroll(function() {
            if(documentContent !== undefined) {
                fileDesc.previewScrollTop = $previewContainerElt.scrollTop();
            }
        });

        // Create the converter and the editor
        var converter = new Markdown.Converter();
        var options = {
            _DoItalicsAndBold: function(text) {
                // Restore original markdown implementation
                text = text.replace(/(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\1/g,
                "<strong>$2</strong>");
                text = text.replace(/(\*|_)(?=\S)(.+?)(?=\S)\1/g,
                "<em>$2</em>");
                return text;
            }
        };
        converter.setOptions(options);

        function checkDocumentChanges() {
            var newDocumentContent = $editorElt.val();
            if(aceEditor !== undefined) {
                newDocumentContent = aceEditor.getValue();
            }
            if(documentContent !== undefined && documentContent != newDocumentContent) {
                fileDesc.content = newDocumentContent;
                eventMgr.onContentChanged(fileDesc);
            }
            documentContent = newDocumentContent;
        }


        if(window.lightMode) {
            editor = new Markdown.EditorLight(converter);
        }
        else {
            editor = new Markdown.Editor(converter, undefined, {
                keyStrokes: shortcutMgr.getPagedownKeyStrokes()
            });
        }

        editor['eventMgr'] = eventMgr;

        //==============
        // MD API start

        MD = editor;
        MD.focus = function () {
            aceEditor ? aceEditor.focus() : $editorElt.focus();
        };
        MD.setContent = function (content) {
            var desc = {
                content: content
            }
            // Notify extensions
            // eventMgr.onFileSelected(desc);

            // Refresh the editor (even if it's the same file)
            core.initEditor(desc);
        };
        MD.getContent = function () {
            if(aceEditor !== undefined) {
                return aceEditor.getValue();
            }
            return $editorElt.val();
        };
        // 重新refresh preview
        MD.onResize = function () {
            eventMgr.onLayoutResize();
            return fileDesc;
        };

        if (!window.lightMode) {
            MD.aceEditor = aceEditor;
        }

        MD.clearUndo = function () {
            if(window.lightMode) {
                MD.undoManager.reinit();
            }
            else {
                aceEditor.getSession().setUndoManager(new ace.UndoManager());
            }
            // 重新设置undo, redo button是否可用状态
            MD.uiManager.setUndoRedoButtonStates();
        };

        // MD API end
        //==============

        // Custom insert link dialog
        editor.hooks.set("insertLinkDialog", function(callback) {
            core.insertLinkCallback = callback;
            utils.resetModalInputs();
            insertLinkO.modal();
            return true;
        });
        // Custom insert image dialog
        editor.hooks.set("insertImageDialog", function(callback) {
            core.insertLinkCallback = callback;
            if(core.catchModal) {
                return true;
            }
            utils.resetModalInputs();
            var ifr = $("#leauiIfrForMD");
            if(!ifr.attr('src')) {
                ifr.attr('src', '/album/index?md=1');
            }
            $(".modal-insert-image").modal();
            return true;
        });

        if(true) {
            previewWrapper = function(makePreview) {
                var debouncedMakePreview = _.debounce(makePreview, 500);
                return function() {
                    if(documentContent === undefined) {
                        makePreview();

                        eventMgr.onFileOpen(fileDesc);
                        $previewContainerElt.scrollTop(fileDesc.previewScrollTop);
                        if(window.lightMode) {
                            $editorElt.scrollTop(fileDesc.editorScrollTop);
                        }
                        else {
                            _.defer(function() {
                                aceEditor.renderer.scrollToY(fileDesc.editorScrollTop);
                            });
                        }
                    }
                    else {
                        debouncedMakePreview();
                    }
                    checkDocumentChanges();
                };
            };
        }
        else {
            previewWrapper = function(makePreview) {
                return function() {
                    makePreview();
                    if(documentContent === undefined) {
                        eventMgr.onFileOpen(fileDesc);
                        $previewContainerElt.scrollTop(fileDesc.previewScrollTop);
                        if(window.lightMode) {
                            $editorElt.scrollTop(fileDesc.editorScrollTop);
                        }
                        else {
                            _.defer(function() {
                                aceEditor.renderer.scrollToY(fileDesc.editorScrollTop);
                            });
                        }
                    }
                    checkDocumentChanges();
                };
            };
        }

        eventMgr.onPagedownConfigure(editor);
        editor.hooks.chain("onPreviewRefresh", eventMgr.onAsyncPreview);
        if(window.lightMode) {
            editor.run(previewWrapper);
            editor.undoManager.reinit(initDocumentContent, fileDesc.editorStart, fileDesc.editorEnd, fileDesc.editorScrollTop);
            // $editorElt.focus();
        }
        else {
            editor.run(aceEditor, previewWrapper);
            fileDesc.editorSelectRange && aceEditor.selection.setSelectionRange(fileDesc.editorSelectRange);
            // aceEditor.focus();
        }

        // Hide default buttons
        $(".wmd-button-row li").addClass("btn btn-success").css("left", 0).find("span").hide();

        // Add customized buttons
        var $btnGroupElt = $('.wmd-button-group1');

        $("#wmd-bold-button").append($('<i class="fa fa-bold">')).appendTo($btnGroupElt);
        $("#wmd-italic-button").append($('<i class="fa fa-italic">')).appendTo($btnGroupElt);
        $btnGroupElt = $('.wmd-button-group2');
        $("#wmd-link-button").append($('<i class="fa fa-link">')).appendTo($btnGroupElt);
        $("#wmd-quote-button").append($('<i class="fa fa-quote-left">')).appendTo($btnGroupElt);
        $("#wmd-code-button").append($('<i class="fa fa-code">')).appendTo($btnGroupElt);
        $("#wmd-image-button").append($('<i class="fa fa-picture-o">')).appendTo($btnGroupElt);
        $btnGroupElt = $('.wmd-button-group3');
        $("#wmd-olist-button").append($('<i class="fa fa-list-ol">')).appendTo($btnGroupElt);
        $("#wmd-ulist-button").append($('<i class="fa fa-list-ul">')).appendTo($btnGroupElt);
        $("#wmd-heading-button").append($('<i class="fa fa-header">')).appendTo($btnGroupElt);
        $("#wmd-hr-button").append($('<i class="fa fa-ellipsis-h">')).appendTo($btnGroupElt);
        // $btnGroupElt = $('.wmd-button-group4');
        $("#wmd-undo-button").append($('<i class="fa fa-undo">')).appendTo($btnGroupElt);
        $("#wmd-redo-button").append($('<i class="fa fa-repeat">')).appendTo($btnGroupElt);

        if (!window.lightMode) {
            $('.wmd-button-group4').html(['<div class="btn-group">',
                    '<button type="button" class="wmd-button btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="' + getMsg('Edit mode') + '">',
                      '<i class="fa fa-gear"></i> <i id="md-keyboard-mode"></i>',
                    '</button>',
                    '<ul class="dropdown-menu wmd-mode">',
                      '<li><a href="#" data-mode="textarea">' + getMsg('Normal mode') + '</a></li>',
                      '<li><a href="#" data-mode="Vim">' + getMsg('Vim mode') + '</a></li>',
                      '<li><a href="#" data-mode="Emacs">' + getMsg('Emacs mode') + '</a></li>',
                    '</ul>',
                  '</div>'].join(''));

            $("#wmd-help-button").show();
            var $mdKeyboardMode = $('#md-keyboard-mode');
            var localSKey = 'LeaMdAceMode'
            MD.changeAceKeyboardMode = function(mode, modeName) {
                localS.set(localSKey, mode);
                if (mode != 'vim' && mode != 'emacs') {
                    aceEditor.setKeyboardHandler(MD.defaultKeyboardMode);
                    $mdKeyboardMode.html('');
                }
                else {
                    aceEditor.setKeyboardHandler("ace/keyboard/" + mode);
                    $mdKeyboardMode.html(modeName);
                }
                aceEditor.focus();
            }
            // 编辑模式选择
            MD.defaultKeyboardMode = aceEditor.getKeyboardHandler();
            $('.wmd-mode a').click(function () {
                var mode = $(this).data('mode');
                MD.changeAceKeyboardMode(mode.toLowerCase(), mode);
            });
            // 是否可以从storage中设置md mode
            if (!window.LEA || (window.LEA && window.LEA.canSetMDModeFromStorage && window.LEA.canSetMDModeFromStorage())) {
                var userMode = localS.get(localSKey);
                if (userMode) {
                    var userModeUpper = userMode[0].toUpperCase() + userMode.substr(1);
                    MD.changeAceKeyboardMode(userMode, userModeUpper);
                }
            }
        }
    };

    // Initialize multiple things and then fire eventMgr.onReady
    var isDocumentPanelShown = false;
    var isMenuPanelShown = false;
    core.onReady = function() {

        $navbarElt = $('.navbar');
        $leftBtnElts = $navbarElt.find('.left-buttons');
        $rightBtnElts = $navbarElt.find('.right-buttons');
        $leftBtnDropdown = $navbarElt.find('.left-buttons-dropdown');
        $rightBtnDropdown = $navbarElt.find('.right-buttons-dropdown');

        // Editor
        if(window.lightMode) {
            // In light mode, we replace ACE with a textarea
            $('#wmd-input').replaceWith(function() {
                return $('<textarea id="wmd-input">').addClass(this.className).addClass('form-control');
            });
        }

        $editorElt = $("#wmd-input, .textarea-helper").css({
            // Apply editor font
            "font-family": constants.fontFamily,
            "font-size": constants.fontSize + "px",
            "line-height": Math.round(constants.fontSize * (20 / 12)) + "px"
        });

        if(!window.lightMode) {
            // ACE editor
            createAceEditor();

            // Editor's element
            $editorElt.find('.ace_content').css({
                "background-size": "64px " + Math.round(constants.fontSize * (20 / 12)) + "px",
            });
        }

        eventMgr.onReady();
        core.initEditor();
    };

    // Other initialization that are not prioritary
    eventMgr.addListener("onReady", function() {

        $(document.body).on('shown.bs.modal', '.modal', function() {
            var $elt = $(this);
            setTimeout(function() {
                // When modal opens focus on the first button
                $elt.find('.btn:first').focus();
                // Or on the first link if any
                $elt.find('button:first').focus();
                // Or on the first input if any
                $elt.find("input:enabled:visible:first").focus();
            }, 50);
        }).on('hidden.bs.modal', '.modal', function() {
            // Focus on the editor when modal is gone
            // editor.focus();
            // Revert to current theme when settings modal is closed
            // applyTheme(window.theme);
        }).on('keypress', '.modal', function(e) {
            // Handle enter key in modals
            if(e.which == 13 && !$(e.target).is("textarea")) {
                $(this).find(".modal-footer a:last").click();
            }
        });
       
        // Click events on "insert link" and "insert image" dialog buttons
        actionInsertLinkO.click(function(e) {
            var value = utils.getInputTextValue($("#input-insert-link"), e);
            if(value !== undefined) {
                var arr = value.split(' ');
                var text = '';
                var link = arr[0];
                if (arr.length > 1) {
                    arr.shift();
                    text = $.trim(arr.join(' '));
                }
                if (link && link.indexOf('://') < 0) {
                    link = "http://" + link;
                }
                core.insertLinkCallback(link, text);
                core.insertLinkCallback = undefined;
            }
        });
        // 插入图片
        $(".action-insert-image").click(function() {
            // 得到图片链接或图片
            /*
            https://github.com/leanote/leanote/issues/171
            同遇到了网页编辑markdown时不能添加图片的问题。
            可以上传图片，但是按下“插入图片”按钮之后，编辑器中没有加入![...](...)
            我的控制台有这样的错误： TypeError: document.mdImageManager is undefined
            */
            // mdImageManager是iframe的name, mdGetImgSrc是iframe内的全局方法
            // var value = document.mdImageManager.mdGetImgSrc();
            var value = document.getElementById('leauiIfrForMD').contentWindow.mdGetImgSrc();
            if(value) {
                core.insertLinkCallback(value);
                core.insertLinkCallback = undefined;
            }
        });

        // Hide events on "insert link" and "insert image" dialogs
        insertLinkO.on('hidden.bs.modal', function() {
            if(core.insertLinkCallback !== undefined) {
                core.insertLinkCallback(null);
                core.insertLinkCallback = undefined;
            }
        });

        // Avoid dropdown panels to close on click
        $("div.dropdown-menu").click(function(e) {
            e.stopPropagation();
        });

        // 弹框显示markdown语法
        $('#wmd-help-button').click(function() {
            window.open("http://leanote.com/blog/post/531b263bdfeb2c0ea9000002");
        });

        // Load images
        _.each(document.querySelectorAll('img'), function(imgElt) {
            var $imgElt = $(imgElt);
            var src = $imgElt.data('stackeditSrc');
            if(src) {
                $imgElt.attr('src', window.baseDir + '/img/' + src);
            }
        });
    });

    return core;
});
