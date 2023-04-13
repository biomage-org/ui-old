import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, InputNumber, Space,
} from 'antd';

import _ from 'lodash';

import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const SliderWithInput = (props) => {
  const {
    min, max, value, onUpdate, disabled, step,
  } = props;

  const [, handleChange] = useUpdateThrottled(onUpdate, value);
  const [controlValue, setControlValue] = useState(null);

  const debouncedOnChange = useCallback(
    _.debounce((changedValue) => handleChange(changedValue), 400), [],
  );

  useEffect(() => {
    setControlValue(value);
  }, [value]);

  useEffect(() => {
    if (controlValue === value) { return; }
    debouncedOnChange(controlValue);
  }, [controlValue]);

  const stepToSet = step ?? max / 200;

  return (
    <Space align='start'>
      <Slider
        value={controlValue}
        min={min}
        max={max}
        onChange={(inputValue) => setControlValue(parseFloat(inputValue))}
        step={stepToSet}
        disabled={disabled}
        style={{
          minWidth: 80, display: 'inline-block', flexGrow: 80, margin: '0.5em 0.25em',
        }}
      />

      <InputNumber
        value={controlValue}
        min={min}
        max={max}
        onChange={(inputValue) => {
          const boundedValue = Math.min(Math.max(inputValue, min), max);
          setControlValue(boundedValue);
        }}
        onStep={(newValue) => setControlValue(newValue)}
        step={stepToSet}
        disabled={disabled}
        style={{ width: 60, display: 'inline-block' }}
      />
    </Space>
  );
};

SliderWithInput.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  step: PropTypes.number,
};

SliderWithInput.defaultProps = {
  disabled: false,
  step: null,
};

export default SliderWithInput;
