import React from 'react';
import { screen, render } from '@testing-library/react';

import PlotLegendAlert from 'components/plots/helpers/PlotLegendAlert';

const MockPlot = () => ('MOCK PLOT');

describe('PlotLegendAlert', () => {
  it('Displays plot properly', () => {
    render(
      <PlotLegendAlert
        updateFn={() => {}}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeNull();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
  });

  it('Displays legend is hidden if more than 50 legend items are to be shown', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeInTheDocument();
    expect(screen.getByText(/You can still display the plot legend by changing the value of "Toggle Legend" option in Plot styling settings under "Legend"/gi)).toBeInTheDocument();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
    expect(mockUpdateFn).toHaveBeenCalledTimes(1);
  });

  it('Does not trigger update if the legend is already shown', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        isLegendEnabled
        numLegendItems={1}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
    expect(mockUpdateFn).not.toHaveBeenCalled();
  });

  it('Does not trigger update if the legend is already hidden', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        isLegendEnabled={false}
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
    expect(mockUpdateFn).not.toHaveBeenCalled();
  });
});
