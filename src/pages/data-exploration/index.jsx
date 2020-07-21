import React from 'react';
import {
  PageHeader, Row, Col, Space, Button, Dropdown,
} from 'antd';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import DraggableList from '../../components/draggable-list/DraggableList';
import SearchMenu from '../../components/SearchMenu';
import CellSetsTool from './components/cell-sets-tool/CellSetsTool';
import GeneListTool from './components/gene-list-tool/GeneListTool';
import DiffExprManager from './components/differential-expression-tool/DiffExprManager';
import Embedding from './components/embedding/Embedding';
import HeatmapPlot from './components/heatmap/HeatmapPlot';

const experimentId = '5e959f9c9f4b120771249001';

const categoryInfo = {
  Plots: <PictureOutlined />,
  Tools: <ToolOutlined />,
};

const categoryItems = {
  Tools: [
    {
      name: 'Cell set',
      description: 'Create and manage interesting groupings of cells.',
      key: 'cell-set-tool',
      renderer: () => <CellSetsTool experimentId={experimentId} />,
    },
    {
      name: 'Gene list',
      description: 'Find, organize, and annotate genes in your data set.',
      key: 'gene-list-tool',
      renderer: () => <GeneListTool experimentId={experimentId} />,
    },
    {
      name: 'Differential expression (simple)',
      description: 'Find and explore the most characteristic genes in a set of cells.',
      key: 'diff-expr-tool',
      renderer: () => <DiffExprManager experimentId={experimentId} view='compute' />,
    },
  ],
  Plots: [
    {
      key: 'embedding-plot',
      name: 'UMAP Embedding',
      description: 'Visualize cells clustered by genetic expression using a UMAP embedding.',
      renderer: () => <Embedding experimentId={experimentId} embeddingType='umap' />,
    },
    {
      key: 'heatmap-plot-data-expl',
      name: 'Heatmaps',
      description: 'Gain a high-level understanding of expression levels across large groups of genes and cells.',
      renderer: (width) => <HeatmapPlot heatmapWidth={width} />,
    },
  ],
};

class ExplorationViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addMenuVisible: false,
      openedItems: {
        Tools: [
          categoryItems.Tools[0],
          categoryItems.Tools[1],
        ],
        Plots: categoryItems.Plots,
      },
    };
  }

  openItem(key, itemCategory) {
    const { openedItems } = this.state;

    if (openedItems[itemCategory].find((obj) => obj.key === key)) {
      return;
    }

    const itemToOpen = categoryItems[itemCategory].find((obj) => obj.key === key);
    openedItems[itemCategory].unshift(itemToOpen);
    this.setState({ openedItems });
  }

  renderItems(itemType) {
    const { openedItems } = this.state;
    const openedTools = openedItems[itemType];

    return (
      <DraggableList
        plots={openedTools}
        onChange={(newList) => {
          openedItems[itemType] = newList;
          this.setState({ openedItems });
        }}
      />
    );
  }

  render() {
    const searchMenu = (
      <SearchMenu
        options={categoryItems}
        categoryInfo={categoryInfo}
        onSelect={(key, category) => {
          this.openItem(key, category);
          this.setState({ addMenuVisible: false });
        }}
      />
    );

    const { addMenuVisible } = this.state;

    return (
      <>
        <PageHeader
          className='site-page-header'
          title='Investigator'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
          extra={[
            <Dropdown
              key='search-menu-dropdown'
              overlay={searchMenu}
              visible={addMenuVisible}
              onVisibleChange={(visible) => this.setState({ addMenuVisible: visible })}
            >
              <Button type='primary' onClick={() => this.setState({ addMenuVisible: !addMenuVisible })}>
                Add
                {' '}
                <DownOutlined />
              </Button>
            </Dropdown>,
          ]}
        />
        <Row gutter={16}>
          <Col span={15}>
            <Space direction='vertical' style={{ width: '100%' }}>
              {this.renderItems('Plots')}
            </Space>
          </Col>
          <Col span={9}>
            <Space direction='vertical' style={{ width: '100%' }}>
              {this.renderItems('Tools')}
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default ExplorationViewPage;
