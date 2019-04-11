import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';

import { hideModal } from '../ducks/modals';

const { Header, Title, Body, Footer } = Modal;

const ModalRenderer = (props) => {
  const { modals } = props;

  return !!modals.length && modals.map(modal => {
    const { title, content, footer, id } = modal;
    return (
      <Modal show={true} onHide={() => hideModal(id)}>
        {!!title &&
          <Header>
            <Title>{title}</Title>
          </Header>
        }
        {!!content &&
          <Body>
            {content}
          </Body>
        }
        {!!footer &&
          <Footer>
            {footer}
          </Footer>
        }
      </Modal>
    );
  });
};

const mapStateToProps = ({ view: { modals } }) => ({ modals });

export default connect(mapStateToProps, null)(ModalRenderer);

ModalRenderer.propTypes = {
  modals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.node,
    content: PropTypes.node,
    footer: PropTypes.node,
    id: PropTypes.string.isRequired,
  })).isRequired,
};