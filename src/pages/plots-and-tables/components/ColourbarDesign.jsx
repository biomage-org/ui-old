import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  Radio,
} from 'antd';

const ColourbarDesign = (props) => {
  const { onUpdate, config } = props;

  const [radioval, setradioval] = useState(config.colGradient);

  const onChange = (e) => {
    setradioval(e.target.value);
    onUpdate({ colGradient: e.target.value });
  };

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Styles</div>
        <Form.Item>
          <Radio.Group onChange={onChange} value={radioval}>
            <Radio value='viridis'>Viridis</Radio>
            <Radio value='inferno'>Inferno</Radio>
            <Radio value='spectral'>Spectral</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </>
  );
};

ColourbarDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ColourbarDesign;
