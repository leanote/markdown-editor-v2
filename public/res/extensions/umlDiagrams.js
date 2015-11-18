define([
	'require',
	// "jquery",
	"underscore",
	"utils",
	"classes/Extension",
	'crel'
	// ', Diagram', // 如果加了这两个, 338 KB, 不加, 207KB
	// 'flow-chart'
], function(require, _, utils, Extension, crel
	// ,Diagram, 
	// flowChart
	) {

	var umlDiagrams = new Extension("umlDiagrams", "UML Diagrams", true);
	// umlDiagrams.settingsBlock = umlDiagramsSettingsBlockHTML;
	umlDiagrams.defaultConfig = {
		flowchartOptions: [
			'{',
			'   "line-width": 2,',
			'   "font-family": "sans-serif",',
			'   "font-weight": "normal"',
			'}'
		].join('\n')
	};

	var previewContentsElt = document.getElementById('preview-contents');
	function renderFlow() {
		var flows = previewContentsElt.querySelectorAll('.prettyprint > .language-flow');
		if (!flows || flows.length == 0) {
			return;
		}
		// console.log('flows')
		require(['flow-chart'], function (flowChart) {
			_.each(flows, function(elt) {
				try {
					var chart = flowChart.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'flow-chart'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					chart.drawSVG(containerElt, JSON.parse(umlDiagrams.config.flowchartOptions));
				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}
	function renderSequence() {
		var ses = previewContentsElt.querySelectorAll('.prettyprint > .language-sequence');
		if (!ses || ses.length == 0) {
			return;
		}
		require(['Diagram'], function (Diagram) {
			_.each(ses, function(elt) {
				try {
					var diagram = Diagram.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'sequence-diagram'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					diagram.drawSVG(containerElt, {
						theme: 'simple'
					});

				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}

	function renderFlow() {
		var flows = previewContentsElt.querySelectorAll('.prettyprint > .language-flow');
		if (!flows || flows.length == 0) {
			return;
		}
		// console.log('flows')
		require(['flow-chart'], function (flowChart) {
			_.each(flows, function(elt) {
				try {
					var chart = flowChart.parse(elt.textContent);
					var preElt = elt.parentNode;
					var containerElt = crel('div', {
						class: 'flow-chart'
					});
					preElt.parentNode.replaceChild(containerElt, preElt);
					chart.drawSVG(containerElt, JSON.parse(umlDiagrams.config.flowchartOptions));
				}
				catch(e) {
					console.error(e);
				}
			});
		});
	}

	umlDiagrams.onPagedownConfigure = function(editor) {
		editor.hooks.chain("onPreviewRefresh", function() {
			renderSequence();
			renderFlow();
		});
	};

	return umlDiagrams;
});
