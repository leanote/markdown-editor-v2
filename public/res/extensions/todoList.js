define([
    "classes/Extension",
], function(Extension) {
    var todoList = new Extension("todoList", "Markdown todoList", true);
    todoList.onPagedownConfigure = function(editor) {
        editor.getConverter().hooks.chain("postConversion", function(text) {
            return text.replace(/<li>\[([ xX]?)\] /g, function(matched, b) {
                return !(b == 'x' || b == 'X') ? '<li class="m-todo-item m-todo-empty"><input type="checkbox" /> ' : '<li class="m-todo-item m-todo-done"><input type="checkbox" checked /> '
            });
        });
    };
    return todoList;
});
