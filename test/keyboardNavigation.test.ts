import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import type { Column } from '../src';
import { SelectColumn } from '../src';
import { setup, getSelectedCell, validateCellPosition, getCellsAtRowIndex, getGrid } from './utils';

type Row = undefined;

const rows: readonly Row[] = Array(100);

const columns: readonly Column<Row>[] = [
  SelectColumn,
  { key: 'col2', name: 'col2' },
  { key: 'col3', name: 'col3' },
  { key: 'col4', name: 'col4' },
  { key: 'col5', name: 'col5' },
  { key: 'col6', name: 'col6' },
  { key: 'col7', name: 'col7' }
];

test('basic keyboard navigation', () => {
  setup({ columns, rows });

  // no initial selection
  expect(getSelectedCell()).not.toBeInTheDocument();

  // tab into the grid
  userEvent.tab();
  validateCellPosition(0, 0);

  // tab to the next cell
  userEvent.tab();
  validateCellPosition(1, 0);

  // tab back to the previous cell
  userEvent.tab({ shift: true });
  validateCellPosition(0, 0);

  // arrow navigation
  userEvent.keyboard('{arrowdown}');
  validateCellPosition(0, 1);
  userEvent.keyboard('{arrowright}');
  validateCellPosition(1, 1);
  userEvent.keyboard('{arrowup}');
  validateCellPosition(1, 0);
  userEvent.keyboard('{arrowleft}');
  validateCellPosition(0, 0);

  // page {up,down}/home/end navigation
  fireEvent.keyDown(document.activeElement!, { key: 'PageDown' });
  validateCellPosition(0, 29);
  fireEvent.keyDown(document.activeElement!, { key: 'PageDown' });
  validateCellPosition(0, 58);
  fireEvent.keyDown(document.activeElement!, { key: 'PageUp' });
  validateCellPosition(0, 29);
  userEvent.keyboard('{end}');
  validateCellPosition(6, 29);
  userEvent.keyboard('{home}');
  validateCellPosition(0, 29);
  userEvent.keyboard('{ctrl}{end}');
  validateCellPosition(6, 99);
  userEvent.keyboard('{ctrl}{home}');
  validateCellPosition(0, 0);
});

test('at-bounds basic keyboard navigation', () => {
  setup({ columns, rows });

  // tab into the grid
  userEvent.tab();
  validateCellPosition(0, 0);

  // arrow navigation
  userEvent.keyboard('{arrowup}');
  validateCellPosition(0, 0);
  userEvent.keyboard('{arrowleft}');
  validateCellPosition(0, 0);
  userEvent.keyboard('{ctrl}{end}');
  validateCellPosition(6, 99);
  userEvent.keyboard('{arrowdown}');
  validateCellPosition(6, 99);
  userEvent.keyboard('{arrowright}');
  validateCellPosition(6, 99);

  // page {up,down}/home/end navigation
  userEvent.keyboard('{end}');
  validateCellPosition(6, 99);
  userEvent.keyboard('{ctrl}{end}');
  validateCellPosition(6, 99);
  fireEvent.keyDown(document.activeElement!, { key: 'PageDown' });
  validateCellPosition(6, 99);
  userEvent.keyboard('{ctrl}{home}');
  validateCellPosition(0, 0);
  validateCheckboxHasFocus();
  userEvent.keyboard('{home}');
  validateCheckboxHasFocus();
  validateCellPosition(0, 0);
  userEvent.keyboard('{ctrl}{home}');
  validateCheckboxHasFocus();
  validateCellPosition(0, 0);
  fireEvent.keyDown(document.activeElement!, { key: 'PageUp' });
  validateCellPosition(0, 0);

  // shift+tab tabs out of the grid
  userEvent.tab({ shift: true });
  expect(document.body).toHaveFocus();

  // tab at the end of a row selects the first cell on the next row
  userEvent.tab();
  userEvent.keyboard('{end}');
  userEvent.tab();
  validateCellPosition(0, 1);

  // tab at the end of the grid tabs out of the grid
  userEvent.keyboard('{ctrl}{end}');
  userEvent.tab();
  expect(document.body).toHaveFocus();
});

test('navigation when selected cell not in the viewport', () => {
  const columns: Column<Row>[] = [SelectColumn];
  for (let i = 0; i < 99; i++) {
    columns.push({ key: `col${i}`, name: `col${i}`, frozen: i < 5 });
  }
  setup({ columns, rows });
  userEvent.tab();
  validateCellPosition(0, 0);

  const grid = getGrid();
  userEvent.keyboard('{ctrl}{end}');
  validateCellPosition(99, 99);
  expect(getCellsAtRowIndex(99)).not.toHaveLength(1);

  grid.scrollTop = 0;
  expect(getCellsAtRowIndex(99)).toHaveLength(1);
  userEvent.keyboard('{arrowup}');
  validateCellPosition(99, 98);
  expect(getCellsAtRowIndex(99)).not.toHaveLength(1);

  grid.scrollLeft = 0;
  userEvent.keyboard('{arrowdown}');
  validateCellPosition(99, 99);

  userEvent.keyboard(
    '{home}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}{arrowright}'
  );
  validateCellPosition(7, 99);
  grid.scrollLeft = 2000;
  userEvent.keyboard('{arrowleft}');
  validateCellPosition(6, 99);
});

function validateCheckboxHasFocus() {
  expect(getCellsAtRowIndex(0)[0].querySelector('input')).toHaveFocus();
}