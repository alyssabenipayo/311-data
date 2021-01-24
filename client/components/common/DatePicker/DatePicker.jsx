import React, { useRef, useState, useEffect } from 'react';
import ReactDayPicker from '@components/common/ReactDayPicker';
import PropTypes from 'prop-types';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import IconButton from '@material-ui/core/IconButton';
import useOutsideClick from '@components/common/customHooks/useOutsideClick';
import { makeStyles } from '@material-ui/core';

// TODO: Apply gaps (margin, padding) from theme

const useStyles = makeStyles(theme => ({
  selector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 268,
    backgroundColor: theme.palette.primary.dark,
    padding: 10,
    borderRadius: 5,
  },
  selectorPopUp: {
    position: 'fixed',
  },
  button: {
    padding: 0,
    color: theme.palette.text.dark,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '& svg': {
      fontSize: 20,
      fill: theme.palette.text.primary,
    },
  },
}));

const renderSelectedDays = dates => {
  const [from, to] = dates;
  const isFromSelected = Boolean(from);
  const isBothSelected = Boolean(from && to);

  const selectedDaysElements = [];

  if (isBothSelected) {
    selectedDaysElements.push(
      <span key="from">{from.toLocaleDateString('en-US')}</span>,
      <span key="to">
        -
        {to.toLocaleDateString('en-US')}
      </span>,
    );
    return selectedDaysElements;
  }
  if (isFromSelected) {
    selectedDaysElements.push(
      <span key="from">
        {' '}
        {from.toLocaleDateString('en-US')}
        {' '}
      </span>,
    );
    return selectedDaysElements;
  }
  selectedDaysElements.push(<span key="N/A">Not selected</span>);
  return selectedDaysElements;
};

const DatePicker = ({
  dates, onSelect, open, onToggle, range,
}) => {
  const [coord, setCoord] = useState({});
  const [selectedDays, setSelectedDays] = useState(() => dates);
  const [showCalendar, setShowCalendar] = useState(() => open);
  const classes = useStyles();

  const ref = useRef(null);
  const closeCalendar = useCallback(() => setShowCalendar(false), []);
  useOutsideClick(ref, closeCalendar);

  useEffect(() => {
    setShowCalendar(false);
  }, [open]);

  useEffect(() => {
    setSelectedDays(() => dates);
  }, [dates]);

  useEffect(() => {
    if (ref.current) {
      const { left, top, height } = ref.current.getClientRects()[0];
      const offsetFromSelectorDisplay = 2;

      setCoord(() => ({
        left,
        top: top + height + offsetFromSelectorDisplay,
      }));
    }
  }, []);

  const toggleCalendar = () => {
    setShowCalendar(prevState => !prevState);
    if (onToggle) onToggle();
  };

  const handleDateChage = incomingDates => {
    setSelectedDays(() => incomingDates);
    if (onSelect) onSelect(incomingDates);
  };

  return (
    <div ref={ref} className={classes.selector}>
      <div>{renderSelectedDays(selectedDays)}</div>
      <IconButton
        className={classes.button}
        aria-label="toggle calendar datepicker"
        onClick={toggleCalendar}
        disableFocusRipple
        disableRipple
      >
        <CalendarIcon />
      </IconButton>
      <div style={coord} className={classes.selectorPopUp}>
        {showCalendar ? (
          <ReactDayPicker
            range={range}
            initialDates={selectedDays}
            onChange={handleDateChage}
          />
        ) : null}
      </div>
    </div>
  );
};

DatePicker.propTypes = {
  onSelect: PropTypes.func,
  range: PropTypes.bool,
  open: PropTypes.bool,
  onToggle: PropTypes.func,
  dates: PropTypes.arrayOf(Date),
};

DatePicker.defaultProps = {
  open: false,
  range: false,
  onToggle: null,
  onSelect: null,
  dates: [],
};

export default DatePicker;
