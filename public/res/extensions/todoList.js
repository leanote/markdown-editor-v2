define([
    "classes/Extension",
], function(Extension) {
    var todoList = new Extension("todoList", "Markdown todoList", true);
    todoList.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postConversion", function(text) {
            return text.replace(/<li>(<p>)?\[([ xX]?)\] /g, function(matched, p, b) {
                p || (p = '');
                return !(b == 'x' || b == 'X') ? '<li class="m-todo-item m-todo-empty">' + p + '<input type="checkbox" /> ' : '<li class="m-todo-item m-todo-done">' + p + '<input type="checkbox" checked /> '
            });
        });
    };
    return todoList;
});
