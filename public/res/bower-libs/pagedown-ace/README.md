PageDown ACE
============

**PageDown ACE** is a port of [PageDown](https://code.google.com/p/pagedown/wiki/PageDown) running with [ACE editor](http://ace.c9.io/) instead of a `textarea`.

Basically:

```html
    <div id="wmd-button-bar"></div>
    <div id="wmd-input"></div>
    <script type="text/javascript">
        var converter = new Markdown.Converter();
        var editor = new Markdown.Editor(converter);
        var ace = ace.edit("wmd-input");
        editor.run(ace);
    </script>
```

The [demo page][1] has been updated accordingly.

> Written with [StackEdit](http://benweet.github.io/stackedit/).


  [1]: https://github.com/benweet/pagedown-ace/blob/master/demo/browser/demo.html