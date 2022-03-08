import React from 'react';
import {
  Modal, Form, Button, Space, Select, InputNumber, Dropdown, Menu, Divider, Row,
} from 'antd';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

const criteriaOptions = [
  { value: 'logFC', label: 'logFC' },
  { value: 'p_val_adj', label: 'adj p-value' },
  { value: 'pct_1', label: 'Pct1' },
  { value: 'pct_2', label: 'Pct2' },
  { value: 'auc', label: 'AUC' },
];

const comparisonOptions = [{
  value: 'greaterThan',
  label: 'Greater than',
}, {
  value: 'lessThan',
  label: 'Less than',
},
];

const valueRestrictions = {
  pct_1: [0, 100],
  pct_2: [0, 100],
  logFC: [-50, 50],
  auc: [0, 1],
  p_val_adj: [0, 1],
};

const presetFilters = [
  {
    label: 'Up-regulated',
    columnName: 'logFC',
    comparison: 'greaterThan',
    value: 0,
  }, {
    label: 'Down-regulated',
    columnName: 'logFC',
    comparison: 'lessThan',
    value: 0,
  }, {
    label: 'Significant',
    columnName: 'p_val_adj',
    comparison: 'lessThan',
    value: 0.05,
  },
];

const AdvancedFilteringModal = (props) => {
  const { onCancel, onLaunch } = props;
  const [form] = Form.useForm();
  const advancedFilters = useSelector((state) => (
    state.differentialExpression.comparison.advancedFilters)) || [];
  const {
    loading: diffExprLoading,
    data: diffExprData,
  } = useSelector((state) => state.differentialExpression.properties);

  const tableColumns = Object.keys(diffExprData[0] || {});

  const renderPresetFilters = (add) => (
    <Menu
      onClick={(e) => {
        add(presetFilters[e.key]);
      }}
    >
      {presetFilters.filter((option) => tableColumns.includes(option.columnName)).map((filter, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Menu.Item key={index}>
          {filter.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  const applyFilters = (filters) => {
    const filtersDataToRun = filters.map(({ columnName, comparison, value }) => ({
      type: 'numeric', columnName, comparison, value,
    }));

    onLaunch(filtersDataToRun);
  };

  return (
    <Modal
      visible
      title='Advanced filters'
      onCancel={onCancel}
      footer={null}
      width='530px'
    >
      <Form form={form} onFinish={({ filterForm }) => applyFilters(filterForm)}>
        <Form.List
          name='filterForm'
          initialValue={advancedFilters}

        >
          {(fields, { add, remove }) => (
            <>
              <Row>
                {fields.map((field, index) => {
                  const { columnName } = form.getFieldValue('filterForm')[index];
                  return (
                    <Space key={field.key} align='baseline'>
                      <Form.Item
                        name={[field.name, 'columnName']}
                        rules={[{ required: true, message: 'Please select a property' }]}
                      >
                        <Select
                          placeholder='Select property'
                          style={{ width: 140 }}
                          onChange={() => form.setFieldsValue({})}
                          options={criteriaOptions.filter((option) => tableColumns.includes(option.value))}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'comparison']}
                        rules={[{ required: true, message: 'Please select a comparison' }]}
                      >
                        <Select
                          placeholder='Select comparison'
                          options={comparisonOptions}
                          style={{ width: 150 }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'value']}
                        rules={[{ required: true, message: 'Please input a value' }]}
                      >
                        <InputNumber
                          style={{ width: 140 }}
                          step={columnName ? valueRestrictions[columnName][1] / 100 : 1}
                          min={columnName ? valueRestrictions[columnName][0] : 0}
                          max={columnName ? valueRestrictions[columnName][1] : 0}
                          placeholder='Insert value'
                        />
                      </Form.Item>

                      <CloseOutlined onClick={() => remove(field.name)} style={{ margin: '8px' }} />
                    </Space>
                  );
                })}
              </Row>
              <Row>
                <Space direction='horizontal'>
                  <Button onClick={add} icon={<PlusOutlined />}>
                    Add custom filter
                  </Button>
                  <Dropdown overlay={renderPresetFilters(add)}>
                    <Button icon={<PlusOutlined />}>
                      Add preset filter
                    </Button>
                  </Dropdown>
                </Space>
              </Row>
              <Divider style={{ marginBottom: '10px' }} />
              <div align='end' style={{ marginTop: '0px', width: '100%' }}>
                <Form.Item style={{ marginBottom: '-10px', marginTop: '0px' }}>
                  <Button type='primary' htmlType='submit' disabled={diffExprLoading}>
                    Apply filters
                  </Button>
                </Form.Item>
              </div>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

AdvancedFilteringModal.propTypes = {
  onLaunch: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AdvancedFilteringModal;
