export { idToNum } from './lib/idToNum';
export { sortIds } from './lib/sortIds';
export {
  COPY_STATE,
  default as UnitSelectionContext,
  defaultUnitSelection,
  DESELECT_ALL,
  INITIALIZE_UNITS,
  TOGGLE_SELECT_ALL,
  UNIQUE_SELECT_FIRST,
  UNIQUE_SELECT_LAST,
  UNIQUE_SELECT_NEXT,
  UNIQUE_SELECT_PREVIOUS,
  unitSelectionReducer,
  UPDATE_SORT_FIELDS,
  useSelectedUnitIds,
} from './lib/UnitSelectionContext';
export type { UnitSelectionAction, UnitSelectionState } from './lib/UnitSelectionContext';
export {
  allUnitSelectionState,
  getCheckboxClickHandlerGenerator,
  voidClickHandler,
} from './lib/UnitSelectionFunctions';
export type { SortingRule } from './lib/UnitSelectionTypes';
export { getUnitColor, redistributeUnitColors } from './lib/unit-colors/unitColors';
