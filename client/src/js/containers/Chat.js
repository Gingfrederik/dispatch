import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector, createStructuredSelector } from 'reselect';
import { List, Map } from 'immutable';
import ChatTitle from '../components/ChatTitle';
import Search from '../components/Search';
import MessageBox from '../components/MessageBox';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import { part } from '../actions/channel';
import { openPrivateChat, closePrivateChat } from '../actions/privateChat';
import { searchMessages, toggleSearch } from '../actions/search';
import { select } from '../actions/tab';
import { runCommand, sendMessage, fetchMessages } from '../actions/message';
import { disconnect } from '../actions/server';
import { toggleUserList } from '../actions/ui';
import * as inputHistoryActions from '../actions/inputHistory';
import { getSelectedTab } from '../reducers/tab';
import { getSelectedMessages } from '../reducers/messages';

class Chat extends PureComponent {
  handleSearch = phrase => {
    const { dispatch, tab } = this.props;
    if (tab.isChannel()) {
      dispatch(searchMessages(tab.server, tab.name, phrase));
    }
  };

  handleMessageNickClick = message => {
    const { tab } = this.props;

    this.props.openPrivateChat(tab.server, message.from);
    this.props.select(tab.server, message.from);
  };

  handleFetchMore = () => this.props.dispatch(fetchMessages());

  render() {
    const { title, tab, channel, search, history,
      messages, hasMoreMessages, users, showUserList, inputActions } = this.props;

    let chatClass;
    if (tab.isChannel()) {
      chatClass = 'chat-channel';
    } else if (tab.name) {
      chatClass = 'chat-private';
    } else {
      chatClass = 'chat-server';
    }

    return (
      <div className={chatClass}>
        <ChatTitle
          title={title}
          tab={tab}
          channel={channel}
          toggleSearch={this.props.toggleSearch}
          toggleUserList={this.props.toggleUserList}
          disconnect={this.props.disconnect}
          part={this.props.part}
          closePrivateChat={this.props.closePrivateChat}
        />
        <Search
          search={search}
          onSearch={this.handleSearch}
        />
        <MessageBox
          messages={messages}
          hasMoreMessages={hasMoreMessages}
          tab={tab}
          onNickClick={this.handleMessageNickClick}
          onFetchMore={this.handleFetchMore}
        />
        <MessageInput
          tab={tab}
          channel={channel}
          history={history}
          runCommand={this.props.runCommand}
          sendMessage={this.props.sendMessage}
          {...inputActions}
        />
        <UserList
          users={users}
          tab={tab}
          showUserList={showUserList}
          select={this.props.select}
          openPrivateChat={this.props.openPrivateChat}
        />
      </div>
    );
  }
}

const serverSelector = state => state.servers;
const channelSelector = state => state.channels;
const searchSelector = state => state.search;
const showUserListSelector = state => state.ui.showUserList;
const historySelector = state => {
  if (state.input.index === -1) {
    return null;
  }

  return state.input.history.get(state.input.index);
};

const selectedChannelSelector = createSelector(
  getSelectedTab,
  channelSelector,
  (tab, channels) => channels.getIn([tab.server, tab.name], Map())
);

const usersSelector = createSelector(
  selectedChannelSelector,
  channel => channel.get('users', List())
);

const titleSelector = createSelector(
  getSelectedTab,
  serverSelector,
  (tab, servers) => tab.name || servers.getIn([tab.server, 'name'])
);

const getHasMoreMessages = createSelector(
  getSelectedMessages,
  messages => {
    const first = messages.get(0);
    return first && first.next;
  }
);

const mapStateToProps = createStructuredSelector({
  title: titleSelector,
  tab: getSelectedTab,
  channel: selectedChannelSelector,
  messages: getSelectedMessages,
  hasMoreMessages: getHasMoreMessages,
  users: usersSelector,
  showUserList: showUserListSelector,
  search: searchSelector,
  history: historySelector
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    ...bindActionCreators({
      select,
      toggleSearch,
      toggleUserList,
      searchMessages,
      runCommand,
      sendMessage,
      part,
      disconnect,
      openPrivateChat,
      closePrivateChat
    }, dispatch),
    inputActions: bindActionCreators(inputHistoryActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
