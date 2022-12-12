import { css, cx } from '@emotion/css'
import { colors } from '../utils/colorPallete.js';

export const focusElem = css`
	color: ${colors.active};
	font-weight: 700;
	fill: ${colors.active};
`;

export const toFront = css`
	z-index: 99;
`;