import { BaseAsyncStorage } from '@portkey/did-ui-react';
import EventEmitter from 'events';

export const eventBus = new EventEmitter();

export const asyncStorage = new BaseAsyncStorage();
