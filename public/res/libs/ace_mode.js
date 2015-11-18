// 来自stackeditor/res/libs

define(function(require, exports, module) {
"use strict";

var oop = require("ace/lib/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var MarkdownHighlightRules = require("./ace_mode_highlight_rules").MarkdownHighlightRules;
var MarkdownFoldMode = require("ace/mode/folding/markdown").FoldMode;
// var eventMgr = require('eventMgr');
var Range = require('ace/range').Range
var editor = window['MD']['aceEditor'];

/*
// 这里, 依赖
window['MD']['eventMgr'].addListener('onAceCreated', function(editorParam) {
    editor = editorParam;
});
*/

var Mode = function() {
    var highlighter = new MarkdownHighlightRules();
    
    this.$tokenizer = new Tokenizer(highlighter.getRules());
    this.$embeds = highlighter.getEmbeds();
    
    //this.foldingRules = new MarkdownFoldMode();
};
oop.inherits(Mode, TextMode);

var isIndentingList = false;

(function() {
    this.type = "text";
    this.lineCommentStart = ">";
    
    this.getNextLineIndent = function(state, line, tab) {
        if(isIndentingList === true && (state == "listblock" || state == "listblock-start") && /^\s*(?:[-+*]|\d+\.)\s+$/.test(line)) {
            // When hitting enter twice in a listblock, remove the previous line
            var rows = editor.$getSelectedRows();
            if (rows.last > 1) {
                var range = new Range(
                    rows.last - 2, editor.session.getLine(rows.last - 2).length,
                    rows.last - 1, editor.session.getLine(rows.last - 1).length);
                var previousLine = editor.session.getTextRange(range);
                if(/^\s*(?:[-+*]|\d+\.)\s+$/.test(previousLine)) {
                    editor.session.remove(range);
                }
            }
            isIndentingList = false;
            return this.$getIndent(line);
        }
        isIndentingList = false;
        if (state == "listblock") {
            var match = /^(\s*)(?:([-+*])|(\d+)\.)(\s+)/.exec(line);
            if (!match)
                return "";
            var marker = match[2];
            if (!marker)
                marker = parseInt(match[3], 10) + 1 + ".";
            isIndentingList = true;
            return match[1] + marker + match[4];
        } else {
            return this.$getIndent(line);
        }
    };
    
}).call(Mode.prototype);

exports.Mode = Mode;
});
