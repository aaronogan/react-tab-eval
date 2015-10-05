var React = require('react');
var ReactBootstrap = require('react-bootstrap');
var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;

// Models
var ContentType = {
  HOME: 'content-type-home',
  TYPE_1: 'content-type-1',
  TYPE_2: 'content-type-2',
  TYPE_3: 'content-type-3'
};

ContentType.getTitle = function(contentType) {
  switch(contentType) {
    case ContentType.HOME:
      return '+';
    case ContentType.TYPE_1:
      return 'Type 1';
    case ContentType.TYPE_2:
      return 'Type 2';
    case ContentType.TYPE_3:
      return 'Type 3';
    default:
      throw new Error('ContentType not recognized.');
  }
};

ContentType.getIcon = function(contentType) {
  if (ContentType.HOME === contentType) {
    return null;
  }
  return 'http://placehold.it/15x15';
};

ContentType.getContent = function(contentType) {
  return ContentType.getTitle(contentType) + ' Content';
};

var TabModel = function(id, name, contentType) {
  this.id = id;
  this.name = name;
  this.contentType = contentType;
};

$.extend(TabModel.prototype, {
  getId: function() {
    return this.id;
  },

  getKey: function() {
    return this.getId();
  },

  getIcon: function() {
    return ContentType.getIcon(this.contentType);
  },

  getTitle: function() {
    return ContentType.getTitle(this.contentType);
  },

  getContentType: function() {
    return this.contentType;
  }
});

var TabsModel = function() {
  this.activeTabKey = 1;
  this.offset = 0;
  this.contentTypes = [ContentType.HOME, ContentType.TYPE_1, ContentType.TYPE_2, ContentType.TYPE_3];

  this.tabs = [];
  this.initializeTabs();

  this.tabKey = 1;

  this.data = this.getNewData();
};

$.extend(TabsModel.prototype, {
  getNewData: function() {
    return {
      activeTabKey: this.activeTabKey,
      contentTypes: this.contentTypes,
      tabs: this.tabs,
      offset: this.offset
    };
  },

  updateData: function() {
    var newData = this.getNewData();
    if (JSON.stringify(newData) !== JSON.stringify(this.data)) {
      $.extend(this.data, newData);
    }
  },

  setActiveTab: function(key) {
    this.activeTabKey = key;
    this.updateData();
  },

  openTab: function(contentType) {
    var name = ContentType.getTitle(contentType);
    var tabKey = ++this.tabKey;
    // Open new tab on the left (but right of the home tab)
    this.tabs.splice(1, 0, new TabModel(tabKey, name, contentType));
    this.activeTabKey = tabKey;
    this.updateData();
  },

  closeTab: function(key) {
    var index = this.getTabIndexByKey(key);
    this.tabs.splice(index, 1);

    if (this.tabs.length === 1) {
      // home tab
      this.activeTabKey = this.tabs[0].getKey();
    } else {
      // tab to the right
      this.activeTabKey = this.tabs[index].getKey();
    }
    this.updateData();
  },

  scrollTabs: function(direction, offset) {
    if ('left' === direction) {
      this.offset -= offset;
    } else {
      this.offset += offset;
    }
    this.updateData();
  },

  initializeTabs: function() {
    this.tabs = [this.getHomeTab()];
  },

  getHomeTab: function() {
    // Special case
    return new TabModel(1, null, ContentType.HOME);
  },

  getTabIndexByKey: function(key) {
    for (var i = 0; i < this.tabs.length; i++) {
      if (this.tabs[i].getKey() === key) {
        return i;
      }
    }
    return -1;
  }
});

TabsModel.instance = undefined;
TabsModel.getInstance = function() {
  if (!TabsModel.instance) {
    TabsModel.instance = new TabsModel();
  }
  return TabsModel.instance;
}

// Actions and events
var EventBus = function() {};

$.extend(EventBus.prototype, {
  dispatchEvent: function(eventType, properties) {
    $(this).trigger(eventType, properties);
  }
});

EventBus.instance = undefined;
EventBus.getInstance = function() {
  if (!EventBus.instance) {
    EventBus.instance = new EventBus();
  }
  return EventBus.instance;
};

var Actions = function() {
  this.model = TabsModel.getInstance();

  this.eventBus = EventBus.getInstance();

  this.eventMap = {};
  this.eventMap[Actions.EventType.ACTIVATE_TAB] = this.activateTab.bind(this);
  this.eventMap[Actions.EventType.OPEN_TAB] = this.openTab.bind(this);
  this.eventMap[Actions.EventType.CLOSE_TAB] = this.closeTab.bind(this);
  this.eventMap[Actions.EventType.SCROLL_TABS] = this.scrollTabs.bind(this);

  this.setupListeners();
};

$.extend(Actions.prototype, {
  setupListeners: function() {
    Object.keys(this.eventMap).forEach(function(eventType) {
      $(this.eventBus).on(eventType, this.eventMap[eventType]);
    }, this);
  },

  activateTab: function(event, properties) {
    this.model.setActiveTab(properties.key);
  },

  openTab: function(event, properties) {
    this.model.openTab(properties.contentType);
  },

  closeTab: function(event, properties) {
    this.model.closeTab(properties.key);
  },

  scrollTabs: function(event, properties) {
    this.model.scrollTabs(properties.direction, properties.offset);
  }
});

Actions.EventType = {
  ACTIVATE_TAB: 'activate_tab',
  CLOSE_TAB: 'close_tab',
  OPEN_TAB: 'open_tab',
  SCROLL_TABS: 'scroll_tabs'
};

Actions.instance = undefined;
Actions.getInstance = function() {
  if (!Actions.instance) {
    Actions.instance = new Actions();
  }
  return Actions.instance;
};

// Child views
var TabMenu = React.createClass({
  componentWillMount: function() {
    this.eventBus = EventBus.getInstance();
    this.actions = Actions.getInstance();
  },

  render: function() {
    return (
      <span className="dropdown">
        <button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <span className="caret"></span>
        </button>
        <ul className="dropdown-menu">
          <li onClick={this.closeTab.bind(this, this.props.tabKey)}>Close</li>
          <li>Duplicate</li>
          <li>Rename</li>
          <li>Delete</li>
        </ul>
      </span>
    );
  },

  closeTab: function(key, e) {
    e.preventDefault();
    this.eventBus.dispatchEvent(Actions.EventType.CLOSE_TAB, { key: key });
  }
});

var TabNavButton = React.createClass({
  componentWillMount: function() {
    this.eventBus = EventBus.getInstance();
    this.actions = Actions.getInstance();
  },

  render: function() {
    var direction = this.props.direction;
    var buttonClasses = React.addons.classSet({
      'tab-navigation': true,
      'tab-navigation-left': 'left' === direction,
      'tab-navigation-right': 'left' !== direction
    });

    var buttonStyle = 'left' === direction ?
      { 'left': this.props.offset } :
      { 'right': -this.props.offset };

    var spanClasses = React.addons.classSet({
      'glyphicon': true,
      'glyphicon-chevron-left': 'left' === direction,
      'glyphicon-chevron-right': 'left' !== direction
    });

    return (
      <button type="button"
          className={buttonClasses}
          style={buttonStyle}
          data-direction={direction}
          onClick={this.handleClick}>
        <span className={spanClasses}></span>
      </button>
    );
  },

  handleClick: function() {
    var eventMap = {
      direction: this.props.direction,
      offset: 25
    };
    this.eventBus.dispatchEvent(Actions.EventType.SCROLL_TABS, eventMap);
  }
});

var TabList = React.createClass({
  componentWillMount: function() {
    this.eventBus = EventBus.getInstance();
    this.actions = Actions.getInstance();
  },

  render: function () {
    var data = this.props.data;

    var tabs = this.props.tabs.map(function(tab, i) {
      return (
        <NavItem key={i} active={tab.active} eventKey={tab.id}>
          {(() => {
            if (tab.icon) {
              return (<img src={tab.icon} className="tab-icon" />);
            }
          })()}
          {tab.title}
          {(() => {
            if (tab.menu) {
              return (<TabMenu tabKey={tab.id} />);
            }
          })()}
        </NavItem>
      );
    });

    return (
      <div className="tab-list">
        <TabNavButton direction="left" offset={this.props.offset} />
        <Nav bsStyle="tabs" activeKey={this.props.activeKey} onSelect={this.handleSelect}>
          {tabs}
        </Nav>
        <TabNavButton direction="right" offset={this.props.offset} />
      </div>
    );
  },

  componentDidUpdate: function() {
    $(this.getDOMNode()).scrollLeft(this.props.offset);
  },

  handleSelect: function(key) {
    this.eventBus.dispatchEvent(Actions.EventType.ACTIVATE_TAB, { key: key });
  },
});

var HomeTabContent = React.createClass({
  componentWillMount: function() {
    this.eventBus = EventBus.getInstance();
    this.actions = Actions.getInstance();
  },

  render: function() {
    return (
      <ul>
        <li>
          <a onClick={this.handleOpen.bind(this, ContentType.TYPE_1)} href="javascript:void(0)">
            Open Type 1
          </a>
        </li>
        <li>
          <a onClick={this.handleOpen.bind(this, ContentType.TYPE_2)} href="javascript:void(0)">
            Open Type 2
          </a>
        </li>
        <li>
          <a onClick={this.handleOpen.bind(this, ContentType.TYPE_3)} href="javascript:void(0)">
            Open Type 3
          </a>
        </li>
      </ul>
    );
  },

  handleOpen: function(contentType) {
    this.eventBus.dispatchEvent(Actions.EventType.OPEN_TAB, { contentType: contentType });
  }
});

var OtherTabContent = React.createClass({
  render: function() {
    return (
      <div id={this.props.contentType} className="tab-pane">
        <div>ContentType: {this.props.contentType}</div>
      </div>
    );
  }
});

var TabPaneContent = React.createClass({
  render: function() {
    // One content pane per content type
    var panes = this.props.contentTypes.map(function(contentType, i) {
      var tabKeys = this.getTabKeys(contentType);
      var contents = ContentType.HOME === contentType ?
      (<HomeTabContent />) :
      (<OtherTabContent contentType={contentType} />);

      return (
        <TabPane key={i} tabKeys={tabKeys} activeKey={this.props.activeKey}>
          {contents}
        </TabPane>
      );
    }, this);

    return (
      <div className="tab-content">
        {panes}
      </div>
    );
  },

  getTabKeys: function(contentType) {
    var keys = this.props.tabs.map(function(tab, i) {
      return { index: i, key: tab.getKey(), contentType: tab.getContentType() };
    }).filter(function(tab) {
      return contentType === tab.contentType;
    }).map(function(tab) {
      return tab.key;
    });

    return keys;
  }
});

var TabPane = React.createClass({
  getClasses(keys, activeKey) {
    var classes = ['tab-pane'];
    var isActive = keys.find(function(key){
      return key === activeKey;
    });
    if (isActive) {
      classes.push('active');
    }
    return classes.join(' ');
  },

  render() {
    var classes = this.getClasses(this.props.tabKeys, this.props.activeKey);
    return (
      <div className={classes}>{this.props.children} key: [{this.props.activeKey}]</div>
    );
  }
});

// Parent view
var TabContainer = React.createClass({
  componentWillMount: function() {
    this.setupListeners();
  },

  getInitialState: function() {
    return this.getModel().data;
  },

  render: function() {
    var tabListData = this.getTabListData();
    var tabPaneContentData = this.getTabPaneContentData();

    return (
      <div className="tab-container">
        <TabList
          activeKey={this.state.activeTabKey}
          offset={this.state.offset}
          tabs={tabListData} />

        <TabPaneContent
          activeKey={this.state.activeTabKey}
          contentTypes={this.state.contentTypes}
          tabs={this.state.tabs}
          panes={tabPaneContentData} />
      </div>
    );
  },

  getModel: function() {
    return TabsModel.getInstance();
  },

  setupListeners: function() {
    Object.observe(this.getModel().data, this.update);
  },

  update: function() {
    this.setState(this.getModel().data);
  },

  getTabListData: function() {
    var modelData = this.getModel().data;
    
    return modelData.tabs.map(function(tab, i) {
      return {
        id: tab.getId(),
        active: tab.getKey() === modelData.activeTabKey,
        icon: tab.getIcon(),
        title: tab.getTitle(),
        menu: ContentType.HOME !== tab.getContentType()
      };
    }, this);
  },

  getTabPaneContentData: function() {
    var modelData = this.getModel().data;
    return modelData.contentTypes.map(function(contentType, i) {
      return {
        id: contentType,
        key: i,
        contentType: contentType,
        text: ContentType.getTitle(contentType)
      };
    });
  }
});

React.render(<TabContainer />, document.getElementById('tabs-container'));