import React, { useEffect } from 'react'
import { Modal } from 'bootstrap';
import { useAuth } from '../contexts/AuthContext';

const ConfirmStatus = ({ fetchUsers, userInfo, setUserInfo }) => {
    const { updateStatus } = useAuth()

    const handleClose = () => {
        const modalElement = document.getElementById('update_status');
        const modalInstance = Modal.getInstance(modalElement);
        modalInstance.hide();
        const customModal = document.querySelector('.custom_modal');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop || customModal) {
            backdrop.remove();
            customModal.classList.remove('show');
        }
        setUserInfo({
            id: "",
            status: ""
        })
    }

    useEffect(() => {
        const handleModalHidden = () => {
            document.body.classList.remove('modal-open');
            document.body.style = '';
        }

        const handleModalShown = () => {
            document.body.style.overflow = 'hidden';
        };

        const modalElement = document.getElementById('update_status');
        modalElement.addEventListener('shown.bs.modal', handleModalShown);
        modalElement.addEventListener('hidden.bs.modal', handleModalHidden);

        return () => {
            modalElement.removeEventListener('shown.bs.modal', handleModalShown);
            modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
        };
    }, [])

    const handleStatus = async () => {
        const { id, status } = userInfo
        await updateStatus(id, status)
        handleClose()
        fetchUsers()
    }

    return (
        <>
            <div className="modal fade custom_modal delete_modal" id="update_status" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Status confirmation</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => handleClose()}></button>
                        </div>
                        <div className="modal-body delete-modal-body">
                            <span className="p-confirm-dialog-icon pi pi-info-circle info-delete-circle" data-pc-section="icon"></span>
                            {userInfo?.status === true ? (<div>
                                Are you sure you want to activate this user?
                            </div>) : (<div>
                                Are you sure you want to deactivate this user?
                            </div>)
                            }
                        </div>
                        <div className="modal-footer delte-modal-footer">
                            <button type="button" className="btn close_btn" data-bs-dismiss="modal">No</button>
                            <button type="submit" className="btn common_btn" onClick={() => handleStatus()}>Yes</button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default ConfirmStatus
