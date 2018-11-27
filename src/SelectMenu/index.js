import React, { Component } from 'react';

export default class SelectMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedItem: null,
      open: false,
    }
    this.openMenu = this.openMenu.bind(this);
  }
  componentDidMount() {
    this.setState({
      selectedItem: this.props.selected || this.props.items[0],
    });
  }
  openMenu() {
    this.setState({
      open: true,
    });
  }
  selectItem(selectedItem) {
    this.setState({
      selectedItem,
      open: false,
    });
    if (this.props.onItemSelect) this.props.onItemSelect(selectedItem);
  }
  renderClosedMenu(Component) {
    return (
      <Component onClick={this.openMenu} {...this.state.selectedItem} />
    );
  }
  renderOpenMenu(Component) {
    return this.props.items.map((item) => {
      return (
        <Component key={item.id} onClick={() => this.selectItem(item)} {...item} />
      );
    });
  }
  render() {
    const { component: Component } = this.props;
    return (this.state.open ?
          (this.renderOpenMenu(Component)) : (this.renderClosedMenu(Component))
    );
  }
}