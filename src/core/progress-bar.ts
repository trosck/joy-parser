import {
  MultiBar,
  GenericBar,
  Presets,
  Format,
  ValueFormatter
} from 'cli-progress'

class MultiProgressBar extends MultiBar {
  constructor(options = {}, presets = Presets.legacy) {
    super(
      {
        formatValue,
        hideCursor: false,
        clearOnComplete: false,
        format: '{bar} {percentage}% {value}/{total} {name}',
        ...options
      },
      presets
    )
  }

  create(
    total: number,
    current: number,
    payload: {}
  ) {
    const bar = super.create(total, current, payload)

    /** freeze payload from changes */
    bar.start = (total, startValue) => {
      GenericBar.prototype.start.call(bar, total, startValue, payload)
    }

    return bar
  }

  /**
   * Create object with methods from BarElement
   * whoes do nothing for compatibility and
   * not to displaying in terminal
   *
   * @returns {Object}
   */
  createEmpty() {
    return {
      start: () => {},
      stop: () => {},
      render: () => {},
      update: () => {},
      increment: () => {},
      getTotal: () => {},
      setTotal: () => {},
      updateETA: () => {}
    }
  }
}

const formatValue: ValueFormatter = (value, options, name) => {
  switch(name) {
    case 'percentage':
      return value.toString().padStart(3)
    case 'value':
      return value.toString().padStart(4)
    case 'total':
      return value.toString().padEnd(4)
    default:
      return Format.ValueFormat(value, options, name)
  }
}

export {
  MultiProgressBar
}
