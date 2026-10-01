'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import ActionForm from './action-form';
export default function ConfirmCancel({id}:{id:string}){return <Dialog.Root><Dialog.Trigger className="btn btn-danger btn-full">Cancel booking</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content"><Dialog.Title>Cancel this booking?</Dialog.Title><Dialog.Description className="muted">Your reserved lab and equipment will become available to other university members. You'll need to create a new request to book them again.</Dialog.Description><ActionForm action="cancel" id={id} danger label="Yes, cancel booking"/><Dialog.Close className="btn btn-secondary">Keep booking</Dialog.Close><Dialog.Close className="dialog-close icon-button" aria-label="Close confirmation"><X size={20}/></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;}
