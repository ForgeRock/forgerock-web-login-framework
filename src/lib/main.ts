import LoginWidget from './widget.svelte';
import { openModal } from './widget.store';

export default LoginWidget;

export const open = openModal;
