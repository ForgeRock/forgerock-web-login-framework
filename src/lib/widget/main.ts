import { FRUser } from '@forgerock/javascript-sdk';
import LoginWidget, { modal as _modal } from './widget.svelte';
// import { openModal } from './widget.store';

export default LoginWidget;

export const modal = _modal;
// export const open = openModal;
export const User = FRUser;
