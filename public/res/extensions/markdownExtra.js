/*globals Markdown */
define([
    "underscore",
    "utils",
    "classes/Extension",
    'google-code-prettify',
    // 'highlightjs',
    'pagedown-extra',
], function(_, utils, Extension, prettify) {

    var markdownExtra = new Extension("markdownExtra", "Markdown Extra", true);
    markdownExtra.defaultConfig = {
        extensions: [
            "fenced_code_gfm",
            "tables",
            "def_list",
            "attr_list",
            "footnotes",
            "smartypants",
            "strikethrough",
            "newlines",
        ],
        intraword: true,
        comments: true,
        highlighter: "prettify"
    };

    var eventMgr;
    markdownExtra.onEventMgrCreated = function(eventMgrParameter) {
        eventMgr = eventMgrParameter;
    };

    function onToggleMode(editor) {
        // 不能加linenums, 加了后, uml不能显示
        // 但是, 有人说没有行号了, 很不好
        // 怎么办
        editor.hooks.chain("onPreviewRefresh", function () {
            $('#preview-contents pre code').each(function () {
                var classes = $(this).attr('class');
                if (classes != 'language-flow' && classes != 'language-sequence') {
                    $(this).parent().addClass('prettyprint linenums'); 
                }
            });
            prettify.prettyPrint();
        });
    }

    markdownExtra.onToggleMode = onToggleMode;

    markdownExtra.onPagedownConfigure = function(editor) {
        var converter = editor.getConverter();
        if(markdownExtra.config.intraword === true) {
            var converterOptions = {
                _DoItalicsAndBold: function(text) {
                    text = text.replace(/([^\w*]|^)(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\2(?=[^\w*]|$)/g, "$1<strong>$3</strong>");
                    text = text.replace(/([^\w*]|^)(\*|_)(?=\S)(.+?)(?=\S)\2(?=[^\w*]|$)/g, "$1<em>$3</em>");
                    return text;
                }
            };
            converter.setOptions(converterOptions);
        }
        if(markdownExtra.config.comments === true) {
            converter.hooks.chain("postConversion", function(text) {
                return text.replace(/<!--.*?-->/g, function(wholeMatch) {
                    return wholeMatch.replace(/^<!---(.+?)-?-->$/, ' <span class="comment label label-danger">$1</span> ');
                });
            });
        }
        
        var extraOptions = {
            extensions: markdownExtra.config.extensions
        };
      
        extraOptions.highlighter = "prettify";
        
        onToggleMode(editor);

        Markdown.Extra.init(converter, extraOptions);
    };

    return markdownExtra;
});