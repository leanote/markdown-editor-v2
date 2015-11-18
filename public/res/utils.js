define([
    "underscore",
    "crel",
    "xregexp",
    // "stacktrace",
    // "FileSaver",
], function(_, crel, XRegExp) {

    var utils = {};

    // Return a parameter from the URL
    utils.getURLParameter = function(name) {
        // Parameter can be either a search parameter (&name=...) or a hash fragment parameter (#!name=...)
        var regex = new RegExp("(?:\\?|\\#\\!|&)" + name + "=(.+?)(?:&|\\#|$)");
        try {
            return decodeURIComponent(regex.exec(location.search + location.hash)[1]);
        }
        catch(e) {
            return undefined;
        }
    };

    // Transform a selector into a jQuery object
    function jqElt(element) {
        if(_.isString(element)) {
            return $(element);
        }
        return element;
    }

    // For input control
    function inputError(element, event) {
        if(event !== undefined) {
            element.stop(true, true).addClass("error").delay(1000).switchClass("error");
            event.stopPropagation();
        }
    }

    // Return input value
    utils.getInputValue = function(element) {
        element = jqElt(element);
        return element.val();
    };

    // Set input value
    utils.setInputValue = function(element, value) {
        element = jqElt(element);
        element.val(value);
    };

    // Return input text value
    utils.getInputTextValue = function(element, event, validationRegex) {
        element = jqElt(element);
        var value = element.val();
        if(value === undefined) {
            inputError(element, event);
            return undefined;
        }
        // trim
        value = utils.trim(value);
        if((value.length === 0) || (validationRegex !== undefined && !value.match(validationRegex))) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input integer value
    utils.getInputIntValue = function(element, event, min, max) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        value = parseInt(value, 10);
        if(isNaN(value) || (min !== undefined && value < min) || (max !== undefined && value > max)) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input value and check that it's a valid RegExp
    utils.getInputRegExpValue = function(element, event) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        try {
            new RegExp(value);
        }
        catch(e) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return input value and check that it's a valid JavaScript object
    utils.getInputJsValue = function(element, event) {
        element = jqElt(element);
        var value = utils.getInputTextValue(element, event);
        if(value === undefined) {
            return undefined;
        }
        try {
            /*jshint evil:true */
            eval("var test=" + value);
            /*jshint evil:false */
        }
        catch(e) {
            inputError(element, event);
            return undefined;
        }
        return value;
    };

    // Return checkbox boolean value
    utils.getInputChecked = function(element) {
        element = jqElt(element);
        return element.prop("checked");
    };

    // Set checkbox state
    utils.setInputChecked = function(element, checked) {
        element = jqElt(element);
        element.prop("checked", checked).change();
    };

    // Get radio button value
    utils.getInputRadio = function(name) {
        return $("input:radio[name=" + name + "]:checked").prop("value");
    };

    // Set radio button value
    utils.setInputRadio = function(name, value) {
        $("input:radio[name=" + name + "][value=" + value + "]").prop("checked", true).change();
    };

    // Reset input control in all modals
    utils.resetModalInputs = function() {
        $(".modal input[type=text]:not([disabled]), .modal input[type=password], .modal textarea").val("");
        $(".modal input[type=checkbox]").prop("checked", false).change();
    };

    // Basic trim function
    utils.trim = function(str) {
        return $.trim(str);
    };

    // Slug function
    var nonWordChars = XRegExp('[^\\p{L}\\p{N}-]', 'g');
    utils.slugify = function(text) {
        return text.toLowerCase().replace(/\s/g, '-') // Replace spaces with -
        .replace(nonWordChars, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
    };

    // Check an URL
    utils.checkUrl = function(url, addSlash) {
        if(!url) {
            return url;
        }
        if(url.indexOf("http") !== 0) {
            url = "http://" + url;
        }
        if(addSlash && url.indexOf("/", url.length - 1) === -1) {
            url += "/";
        }
        return url;
    };

    
    utils.randomString = function() {
        return _.random(4294967296).toString(36);
    };

    // Time shared by others modules
    utils.updateCurrentTime = function() {
        utils.currentTime = new Date().getTime();
    };
    utils.updateCurrentTime();

    // Serialize sync/publish attributes and store it in the storage
    utils.storeAttributes = function(attributes) {
    };

    // Retrieve/parse an index array from storage
    utils.retrieveIndexArray = function(storeIndex) {
    };

    // Append an index to an array in storage
    utils.appendIndexToArray = function(storeIndex, index) {
    };

    // Remove an index from an array in storage
    utils.removeIndexFromArray = function(storeIndex, index) {
    };

    // Retrieve/parse an object from storage. Returns undefined if error.
    utils.retrieveIgnoreError = function(storeIndex) {
    };

    var eventList = [];
    utils.logValue = function(value) {
    };
    utils.logStackTrace = function() {
    };
    utils.formatEventList = function() {
        var result = [];
        _.each(eventList, function(event) {
            result.push("\n");
            if(_.isString(event)) {
                result.push(event);
            }
            else if(_.isArray(event)) {
                result.push(event[5] || "");
                result.push(event[6] || "");
            }
        });
        return result.join("");
    };

    return utils;
});
