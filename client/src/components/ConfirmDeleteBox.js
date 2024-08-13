import React, { useEffect } from 'react'
import { useClient } from '../contexts/ClientContexts'
import { Modal } from 'bootstrap';

const ConfirmDeleteBox = ({ fetchClients, clientsLength, currentPage, setCurrentPage, clientDelId, setClientDelId }) => {
    const { deleteClient } = useClient()

    const handleClose = () => {
        const modalElement = document.getElementById('delete_client');
        const modalInstance = Modal.getInstance(modalElement);
        modalInstance.hide();
        const customModal = document.querySelector('.custom_modal');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop || customModal) {
            backdrop.remove();
            customModal.classList.remove('show');
        }
        setClientDelId("")
    }

    useEffect(() => {
        const handleModalHidden = () => {
            document.body.classList.remove('modal-open');
            document.body.style = '';
        }

        const handleModalShown = () => {
            document.body.style.overflow = 'hidden';
        };

        const modalElement = document.getElementById('add_client');
        modalElement.addEventListener('shown.bs.modal', handleModalShown);
        modalElement.addEventListener('hidden.bs.modal', handleModalHidden);

        return () => {
            modalElement.removeEventListener('shown.bs.modal', handleModalShown);
            modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
        };
    }, [])

    const handleDelete = async () => {
        try {
            if (clientDelId) {
                await deleteClient(clientDelId);
                handleClose()
                fetchClients();
                if (clientsLength === 1) {
                    setCurrentPage(currentPage - 1)
                }
            }
        } catch (error) {
            console.error('Error during delete operation', error);
        }
    }

    return (
        <>
            <div className="modal fade custom_modal delete_modal" id="delete_client" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Delete confirmation</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => handleClose()}></button>
                        </div>
                        <div className="modal-body delete-modal-body">
                            <span class="p-confirm-dialog-icon pi pi-info-circle info-delete-circle" data-pc-section="icon"></span>
                            Are you sure you want to delete this client?
                        </div>
                        <div className="modal-footer delte-modal-footer">
                            <button type="button" className="btn close_btn" data-bs-dismiss="modal">No</button>
                            <button type="submit" className="btn common_btn" onClick={() => handleDelete()}>Yes</button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default ConfirmDeleteBox
