/**
 * 已知BUG:
 * 从light切换到normal, 快捷键没用了
 *
 */

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
        // aceEditor.setOption("spellcheck", true);

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

    var converter;

    var lightEditor;

    var $mdKeyboardMode;

    core._resetToolBar = function () {
        /*
        <ul class="nav left-buttons">
                <li class="wmd-button-group1 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group2 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group3 btn-group"></li>
            </ul>
            <ul class="nav left-buttons">
                <li class="wmd-button-group4 btn-group"></li>
            </ul>
             <ul class="nav left-buttons">
                <li class="wmd-button-group6 btn-group">
                  <li class="wmd-button btn btn-success" id="wmd-help-button" title="Markdown syntax" style="left: 0px; display: none;"><span style="display: none; background-position: 0px 0px;"></span><i class="fa fa-question-circle"></i></li>
                </li>
            </ul>
         */
        $('#wmd-button-row').remove();
        $('#wmd-button-bar .wmd-button-bar-inner').html('<ul class="nav left-buttons"><li class="wmd-button-group1 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group2 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group3 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group4 btn-group"></li></ul><ul class="nav left-buttons"><li class="wmd-button-group6 btn-group"></li><li class="wmd-button btn btn-success" id="wmd-help-button" title="' + getMsg('Markdown syntax') +'" style="left:0;display:none"><span style="display:none;background-position:0 0"></span><i class="fa fa-question-circle"></i></li></ul>');
    };

    core._setEditorHook = function () {
        // Custom insert link dialog
        editor.hooks.set("insertLinkDialog", function(callback) {
            core.insertLinkCallback = callback;
            utils.resetModalInputs();
            insertLinkO.modal();
            return true;
        });
        // Custom insert image dialog
        editor.hooks.set("insertImageDialog", function(callback) {
            // life, atom
            insertLocalImage();
            return true;
        });

        editor.hooks.chain("onPreviewRefresh", eventMgr.onAsyncPreview);
    };

    // 行
    core._moveCursorTo = function (row, column) {
        if (!window.lightMode) {
            aceEditor.moveCursorTo(row, column);
            return;
        }

        // 得到offset
        var offset = core._getTextareaCursorOffset(row, column);

        $('#wmd-input').get(0).setSelectionRange(offset, offset);
        $('#wmd-input').focus();
    };

    // 得到文本编辑器的位置
    // 返回 {row: 0, column: 0}
    core._getTextareaCusorPosition = function () {
        var offset = $('#wmd-input').get(0).selectionStart;
        if (offset == 0) {
            return {row: 0, column: 0};
        }
        var content = MD.getContent() || '';
        var contentArr = content.split('\n');
        var to = 0;
        var row = 0;
        var column = 0;
        for (var row = 0; row < contentArr.length; ++row) {
            var line = contentArr[row];
            
            if (offset <= line.length) {
                column = offset;
                break;
            }
            else {
                offset -= line.length;
            }

            // 下一行\n
            offset--;
        }
        return {row: row, column: column};
    };

    // 通过row, column 得到offset
    core._getTextareaCursorOffset = function (row, column) {
        var offset = 0;
         // 得到offset
        var content = MD.getContent();
        var contentArr = content.split('\n');
        var offset = 0;
        for (var i = 0; i < contentArr.length && i < row; ++i) {
            offset += contentArr[i].length + 1;  // \n 算1个
        }
        offset += column;
        return offset + 1;
    }

    // 切换到轻量编辑器
    core.initLightEditor = function () {
        if (window.lightMode) {
            return;
        }
        var scrollTop = aceEditor.renderer.getScrollTop();
        var pos = aceEditor.getCursorPosition();
        var content = MD.getContent();

        core._resetToolBar();
        aceEditor && aceEditor.destroy();

        // In light mode, we replace ACE with a textarea
        $('#wmd-input').replaceWith(function() {
            return $('<textarea id="wmd-input" class="ace_editor ace-tm wmd-textarea">').addClass(this.className).addClass('form-control');
        });

        core._pre();

        // unbind all event
        // $editorElt.off();

        editor = new Markdown.EditorLight(converter);

        core._setEditorHook();

        editor.run(previewWrapper);

        core._setToolBars();

        $editorElt.val(content);

        window.lightMode = true;
        MD.clearUndo();
        eventMgr.onToggleMode(editor);
        core._moveCursorTo(pos.row, pos.column);
        $editorElt.focus();
        $('#wmd-input').scrollTop(scrollTop);

        // 设置API
        // MD.insertLink = editor.insertLink;
    };

    // 切换到Ace编辑器
    core.initAceEditor = function () {
        if (!window.lightMode) {
            return;
        }
        var scrollTop = $('#wmd-input').scrollTop(); // : 
        var pos = core._getTextareaCusorPosition();
        // console.log(pos);
        var content = MD.getContent();

        core._resetToolBar();
        aceEditor && aceEditor.destroy();

        $('#wmd-input').replaceWith(function () {
            return '<pre id="wmd-input" class="form-control"><div id="wmd-input-sub" class="editor-content mousetrap" contenteditable=true></div><div class="editor-margin"></div></pre>';
        });

        core._pre();

        // ACE editor
        createAceEditor();
        // Editor's element
        $editorElt.find('.ace_content').css({
            "background-size": "64px " + Math.round(constants.fontSize * (20 / 12)) + "px",
        });

        // unbind all event
        // $editorElt.off();

        editor = new Markdown.Editor(converter, undefined, {
            keyStrokes: shortcutMgr.getPagedownKeyStrokes()
        });

        core._setEditorHook();
        editor.run(aceEditor, previewWrapper);

        core._setToolBars();

        aceEditor.setValue(content, -1);
        window.lightMode = false;
        MD.clearUndo();

        eventMgr.onToggleMode(editor);
        core._moveCursorTo(pos.row, pos.column);
        aceEditor.focus();
        aceEditor.session.setScrollTop(scrollTop);

        // 设置API
        // MD.insertLink = editor.insertLink;
    };

    core._initMarkdownConvert = function () {
        // Create the converter and the editor
        converter = new Markdown.Converter();
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

        return converter;
    }

    // 初始化
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

        /*
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
        */

        if(window.lightMode) {
            editor = new Markdown.EditorLight(converter);
        }
        else {
            editor = new Markdown.Editor(converter, undefined, {
                keyStrokes: shortcutMgr.getPagedownKeyStrokes()
            });
        }

        // editor['eventMgr'] = eventMgr;

        core._setEditorHook();

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

        eventMgr.onPagedownConfigure(editor);
        
        if(window.lightMode) {
            editor.run(previewWrapper);
            editor.undoManager.reinit(initDocumentContent, fileDesc.editorStart, fileDesc.editorEnd, fileDesc.editorScrollTop);
        }
        else {
            editor.run(aceEditor, previewWrapper);
            fileDesc.editorSelectRange && aceEditor.selection.setSelectionRange(fileDesc.editorSelectRange);
        }
    };

    // 工具栏按钮
    core._setToolBars = function () {
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

        core._initModeToolbar();
    };

    core.setMDApi = function () {
        //==============
        // MD API start

        // 设置API
        // MD.insertLink = editor.insertLink;

        MD.focus = function () {
            !window.lightMode ? aceEditor.focus() : $('#wmd-input').focus();
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
            if(!window.lightMode) {
                return aceEditor.getValue();
            }
            return $('#wmd-input').val();
            // return $editorElt.val(); // 有延迟?
        };
        

        /*
        if (!window.lightMode) {
            MD.aceEditor = aceEditor;
        }
        */

        // 重新refresh preview
        MD.onResize = function () {
            eventMgr.onLayoutResize();
        };

        // aceEditor resize
        MD.resize = function () {
            if (!window.lightMode) {
                aceEditor.resize();
            }
        };

        MD.clearUndo = function () {
            if(window.lightMode) {
                editor.undoManager.reinit();
            }
            else {
                aceEditor.getSession().setUndoManager(new ace.UndoManager());
            }
            // 重新设置undo, redo button是否可用状态
            editor.uiManager.setUndoRedoButtonStates();
        };

        MD.toggleToAce = function () {
            core.initAceEditor();
        };

        // 切换成light模式
        MD.toggleToLight = function () {
            core.initLightEditor();
        };

        // 以下一行是为了i18n能分析到
        // getMsg('Light') getMsg('Normal')
        MD.setModeName = function(mode) {
            if (mode === 'textarea') {
                mode = 'Normal';
            }
            var msg = getMsg(mode);
            $mdKeyboardMode.html(msg);
        };

        MD.changeAceKeyboardMode = function(mode, modeName) {
            // 保存之
            localS.set(localSModeKey, mode);

            // 之前是lightMode
            if (window.lightMode) {
                // 要切换成ace
                if (mode != 'light') {
                    core.initAceEditor();
                    if (!MD.defaultKeyboardMode) {
                        MD.defaultKeyboardMode = aceEditor.getKeyboardHandler();
                    }
                }
                // 还是ligth, 则返回
                else {
                    return;
                }
            }
            // 当前是ace
            else {
                // 如果mode是light, 则切换之, 否则
                if (mode == 'light') {
                    core.initLightEditor();
                    return;
                }
            }

            // ace切换成其它模式

            if (mode != 'vim' && mode != 'emacs') {
                aceEditor.setKeyboardHandler(MD.defaultKeyboardMode);
                // shortcutMgr.configureAce(aceEditor);
            }
            else {
                aceEditor.setKeyboardHandler("ace/keyboard/" + mode);
            }

            // if (mode != 'light') {
            //     aceEditor.focus();
            // }
        };

        // MD API end
        //==============
    };

    core._initModeToolbar = function () {
        // 可以切换
        if (!window.lightModeForce) {
            $('.wmd-button-group4').html(['<div class="btn-group">',
                    '<button type="button" class="wmd-button btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="' + getMsg('Edit mode') + '">',
                      '<i class="fa fa-gear"></i> <i id="md-keyboard-mode"></i>',
                    '</button>',
                    '<ul class="dropdown-menu wmd-mode">',
                      '<li><a href="#" data-mode="Normal"><i class="fa fa-check"></i> ' + getMsg('Normal mode') + '</a></li>',
                      '<li><a href="#" data-mode="Vim"><i class="fa"></i> ' + getMsg('Vim mode') + '</a></li>',
                      '<li><a href="#" data-mode="Emacs"><i class="fa"></i> ' + getMsg('Emacs mode') + '</a></li>',
                      '<li role="separator" class="divider"></li>',
                      '<li><a href="#" data-mode="Light"><i class="fa"></i> ' + getMsg('Light editor') + '</a></li>',
                    '</ul>',
                  '</div>'].join(''));

            $("#wmd-help-button").show();
            $mdKeyboardMode = $('#md-keyboard-mode');
            
            // 编辑模式选择
            $('.wmd-mode a').click(function () {
                var $this = $(this);
                var mode = $this.data('mode');
                MD.changeAceKeyboardMode(mode.toLowerCase(), mode);
                MD.setModeName(mode);

                // 切换后可能会重绘html, 所以这里重新获取
                $('.wmd-mode').find('i').removeClass('fa-check');
                $('.wmd-mode a[data-mode="' + mode + '"]').find('i').addClass('fa-check');
            });

            if (!window.LEA 
                || (window.LEA 
                    && window.LEA.canSetMDModeFromStorage 
                    && window.LEA.canSetMDModeFromStorage())) {
                var aceMode = localS.get(localSModeKey);
                if (!aceMode) {
                    return;
                }
                var aceModeUpper = aceMode[0].toUpperCase() + aceMode.substr(1);
                $('.wmd-mode i').removeClass('fa-check');
                $('.wmd-mode a[data-mode="' + aceModeUpper + '"] i').addClass('fa-check');

                MD.setModeName(aceModeUpper);
            }
        }
    };

    core._pre = function () {
        $editorElt = $("#wmd-input, .textarea-helper").css({
            // Apply editor font
            "font-family": constants.fontFamily,
            "font-size": constants.fontSize + "px",
            "line-height": Math.round(constants.fontSize * (20 / 12)) + "px"
        });
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
                return $('<textarea id="wmd-input" class="ace_editor ace-tm wmd-textarea">').addClass(this.className).addClass('form-control');
            });
        }

        core._pre();

        if(!window.lightMode) {
            // ACE editor
            createAceEditor();

            // Editor's element
            $editorElt.find('.ace_content').css({
                "background-size": "64px " + Math.round(constants.fontSize * (20 / 12)) + "px",
            });
        }

        eventMgr.onReady();
        core._initMarkdownConvert();
        core.initEditor();
        core.setMDApi();
        core._setToolBars();

        // 默认Ace编辑模式
        if (!window.lightMode) {
            MD.defaultKeyboardMode = aceEditor.getKeyboardHandler();
        }
        // 初始时
        // 是否可以从storage中设置md mode
        if (!window.LEA 
            || (window.LEA 
                && window.LEA.canSetMDModeFromStorage 
                && window.LEA.canSetMDModeFromStorage())) {
            var aceMode = localS.get(localSModeKey);
            if (!window.lightMode && aceMode) {
                var aceModeUpper = aceMode[0].toUpperCase() + aceMode.substr(1);
                MD.changeAceKeyboardMode(aceMode, aceModeUpper);
            }
        }
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
        $('#wmd-button-bar').on('click', '#wmd-help-button', function() {
            var url = "http://leanote.leanote.com/post/Leanote-Markdown-Manual";
            openExternal(url);
        });
    });

    return core;
});