import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Extend dayjs with needed plugins
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

export { dayjs };