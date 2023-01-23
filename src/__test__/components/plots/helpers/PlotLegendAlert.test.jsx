import React from 'react';
import { screen, render } from '@testing-library/react';

import PlotLegendAlert from 'components/plots/helpers/PlotLegendAlert';

const MockPlot = () => ('MOCK PLOT');

describe('PlotLegendAlert', () => {
  it('Displays plot properly', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        updateFn={() => {}}
        numLegendItems={10}
        isLegendEnabled
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeNull();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
    expect(mockUpdateFn).not.toHaveBeenCalled();
  });

  it('Sets updates config.leged.enabled to false on first render if numLegendItems more than limit', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        numLegendItems={100}
        updateFn={mockUpdateFn}
        isLegendEnabled
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
    expect(mockUpdateFn).toHaveBeenCalledTimes(1);
  });

  it('Display alert if more than 50 legend items are to be shown', () => {
    const mockUpdateFn = jest.fn();

    render(
      <PlotLegendAlert
        numLegendItems={100}
        updateFn={mockUpdateFn}
        isLegendEnabled={false}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeInTheDocument();
    expect(screen.getByText(/You can still display the plot legend by changing the value of "Toggle Legend" option in Plot styling settings under "Legend"/gi)).toBeInTheDocument();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
  });

  it('Do not display alert anymore if legend has been seen', () => {
    const mockUpdateFn = jest.fn();

    // First time render should show
    const { rerender } = render(
      <PlotLegendAlert
        isLegendEnabled={false}
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeInTheDocument();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();

    // If the legend enabled is changed, subsequent renders should not show alert
    rerender(
      <PlotLegendAlert
        isLegendEnabled
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeNull();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();

    rerender(
      <PlotLegendAlert
        isLegendEnabled={false}
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeNull();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();

    rerender(
      <PlotLegendAlert
        isLegendEnabled
        numLegendItems={100}
        updateFn={mockUpdateFn}
      >
        <MockPlot />
      </PlotLegendAlert>,
    );

    expect(screen.queryByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot./gi)).toBeNull();
    expect(screen.getByText('MOCK PLOT')).toBeInTheDocument();
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
