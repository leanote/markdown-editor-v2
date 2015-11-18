define([
    "settings",
], function(settings/*, mathjaxConfigJS*/) {
    var script = document.createElement('script');
    script.type = 'text/x-mathjax-config';
    var mathjaxConfigJS = 'MathJax.Hub.Config({\n\tskipStartupTypeset: true,\n    "HTML-CSS": {\n        preferredFont: "TeX",\n        availableFonts: [\n            "STIX",\n            "TeX"\n        ],\n        linebreaks: {\n            automatic: true\n        },\n        EqnChunk: 10,\n        imageFont: null\n    },\n    tex2jax: <%= tex2jax || \'{ inlineMath: [["$","$"],["\\\\\\\\\\\\\\\\(","\\\\\\\\\\\\\\\\)"]], displayMath: [["$$","$$"],["\\\\\\\\[","\\\\\\\\]"]], processEscapes: true }\' %>,\n    TeX: $.extend({\n        noUndefined: {\n            attributes: {\n                mathcolor: "red",\n                mathbackground: "#FFEEEE",\n                mathsize: "90%"\n            }\n        },\n        Safe: {\n            allow: {\n                URLs: "safe",\n                classes: "safe",\n                cssIDs: "safe",\n                styles: "safe",\n                fontsize: "all"\n            }\n        }\n    }, <%= tex %>),\n    messageStyle: "none"\n});\n';
    script.innerHTML = _.template(mathjaxConfigJS, {
        tex: settings.extensionSettings.mathJax ? settings.extensionSettings.mathJax.tex : 'undefined',
        tex2jax: settings.extensionSettings.mathJax ? settings.extensionSettings.mathJax.tex2jax : undefined
    });
    document.getElementsByTagName('head')[0].appendChild(script);
});