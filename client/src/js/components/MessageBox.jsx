var React = require('react');
var Reflux = require('reflux');
var _ = require('lodash');
var Infinite = require('react-infinite');
var Autolinker = require('autolinker');

var MessageHeader = require('./MessageHeader.jsx');
var messageLineStore = require('../stores/messageLine');
var selectedTabStore = require('../stores/selectedTab');
var messageActions = require('../actions/message');

var MessageBox = React.createClass({
	mixins: [
		Reflux.connect(messageLineStore, 'messages'),
		Reflux.connect(selectedTabStore, 'selectedTab')
	],

	getInitialState: function() {
		return {
			messages: messageLineStore.getState(),
			selectedTab: selectedTabStore.getState(),
			height: window.innerHeight - 100
		};
	},

	componentDidMount: function() {
		window.addEventListener('resize', this.handleResize);
	},

	componentWillUnmount: function() {
		window.removeEventListener('resize', this.handleResize);
	},

	componentWillUpdate: function() {
		var el = this.refs.list.getDOMNode();
		this.autoScroll = el.scrollTop + el.offsetHeight === el.scrollHeight;
	},

	componentDidUpdate: function() {
		this.updateWidth();

		if (this.autoScroll) {
			var el = this.refs.list.getDOMNode();
			el.scrollTop = el.scrollHeight;
		}
	},

	handleResize: function() {
		this.updateWidth();
		this.setState({ height: window.innerHeight - 100 });
	},

	updateWidth: function() {
		var width = this.refs.list.getDOMNode().firstChild.offsetWidth;

		if (this.width !== width) {
			this.width = width;
			messageActions.setWrapWidth(width);
		}
	},

	render: function() {
		var tab = this.state.selectedTab;
		var dest = tab.channel || tab.server;
		var lines = [];
		var style = {};
		var innerStyle = {
			paddingLeft: this.props.indent + 'px'
		};

		if (!tab.channel || tab.channel[0] !== '#') {
			style.right = 0;
		}

		for (var j = 0; j < this.state.messages.length; j++) {
			var message = this.state.messages[j];
			var messageClass = 'message';
			var key = message.server + dest + j;

			if (message.type) {
				messageClass += ' message-' + message.type;
			}

			lines.push(<MessageHeader key={key} message={message} />);

			for (var i = 1; i < message.lines.length; i++) {
				var line = Autolinker.link(message.lines[i], { keepOriginalText: true });

				lines.push(
					<p key={key + '-' + i} className={messageClass} style={innerStyle}>
						<span dangerouslySetInnerHTML={{ __html: line }}></span>
					</p>
				);
			}
		}

		if (lines.length !== 1) {
			return (
				<div className="messagebox" style={style}>
					<Infinite ref="list" containerHeight={this.state.height} elementHeight={24}>
						{lines}
					</Infinite>
				</div>
			);
		} else {
			return (
				<div className="messagebox" style={style}>
					<div ref="list">{lines}</div>
				</div>
			);
		}
	}
});

module.exports = MessageBox;