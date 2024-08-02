import React, { useEffect, useState } from 'react';
import { CForm, CFormInput } from '@coreui/react';
import { useClient } from '../contexts/ClientContexts';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from 'bootstrap';

const AddClient = ({ fetchClients, editMode, editClientId, setEditMode, setEditClientId, setCurrentPage }) => {
    const { createClient, getSingleClient, updateClient } = useClient()
    const { auth } = useAuth()

    const [showIndividual, setShowIndividual] = useState(false)
    const [validated, setValidated] = useState(false);
    const [showFullDetail, setShowFullDetail] = useState(false)
    const [clientDetail, setClientDetail] = useState({
        first_name: "",
        last_name: "",
        entity_name: "",
        user_id: "",
        abn_number: "",
        preferred_name: "",
        phone: "",
        email: "",
        client_code: "",
        user_defined: "",
        address: "",
    })

    const handleClose = () => {
        const modalElement = document.getElementById('add_client');
        const modalInstance = Modal.getInstance(modalElement);
        modalInstance.hide();
        const customModal = document.querySelector('.custom_modal');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop || customModal) {
            backdrop.remove();
            customModal.classList.remove('show');
        }

        setClientDetail({
            first_name: "",
            last_name: "",
            entity_name: "",
            user_id: "",
            abn_number: "",
            preferred_name: "",
            phone: "",
            email: "",
            client_code: "",
            user_defined: "",
            address: ""
        })
        setValidated(false)
        setEditMode(false)
        setEditClientId("")
        setShowIndividual(false)
        setShowFullDetail(false)
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



    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.currentTarget;
        setValidated(true);

        if (form.checkValidity() === false) {
            e.stopPropagation();
            const firstInvalidInput = form.querySelector(':invalid');
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            try {
                let data
                if (editMode) {
                    data = await updateClient(editClientId, { ...clientDetail, user_id: auth?.user?._id })
                } else {
                    data = await createClient({ ...clientDetail, user_id: auth?.user?._id });
                    if (!data?.error) {
                        setCurrentPage(1)
                    }
                }

                if (!data?.error) {
                    handleClose()
                    fetchClients()
                }
            } catch (error) {
                console.log(error);
            }
        }
    };

    const fetchSingleClient = async () => {
        if (editMode && editClientId) {
            const client = await getSingleClient(editClientId)
            if (client?.entity_name) {
                setShowIndividual(true)
            }
            setShowFullDetail(true)
            setClientDetail({ ...clientDetail, ...client });
        }
    }

    useEffect(() => {
        if (editMode) {
            fetchSingleClient();
        }
    }, [editMode, editClientId]);

    return (
        <>
            <div className="modal fade custom_modal" id="add_client" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">{editMode ? "Edit Client" : "Quick Add Client"}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => handleClose()}></button>
                        </div>
                        <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                            <div className="modal-body">
                                <div className="input_form_box">
                                    <div className="check_box mb-20">
                                        <input
                                            className="styled-checkbox special_check_add"
                                            id="styled-checkbox-2"
                                            type="checkbox"
                                            checked={showIndividual}
                                            onClick={(e) => {
                                                setValidated(false)
                                                setShowIndividual(e.target.checked)
                                            }}
                                        />
                                        <label htmlFor="styled-checkbox-2">Non-individual</label>
                                    </div>
                                    {
                                        showIndividual ? (
                                            <>
                                                <div>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <div className="form-floating">
                                                                <CFormInput
                                                                    type="text"
                                                                    value={clientDetail.entity_name}
                                                                    onChange={(e) => setClientDetail({ ...clientDetail, entity_name: e.target.value })}
                                                                    required
                                                                    feedbackInvalid={"Entity name is required."}
                                                                    className={'form-control is_not_validated'}
                                                                    id="floatingInput3"
                                                                    placeholder="Entity Name"
                                                                />
                                                                <label htmlFor="floatingInput3">Entity Name</label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) :
                                            (
                                                <>
                                                    <div>
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="form-floating">
                                                                    <CFormInput
                                                                        type="text"
                                                                        value={clientDetail.first_name}
                                                                        onChange={(e) => setClientDetail({ ...clientDetail, first_name: e.target.value })}
                                                                        required
                                                                        feedbackInvalid={"First name is required."}
                                                                        className={'form-control is_not_validated'}
                                                                        id="floatingInput1"
                                                                        placeholder="First Name"
                                                                    />
                                                                    <label htmlFor="floatingInput1">First Name</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="form-floating">
                                                                    <CFormInput
                                                                        type="text"
                                                                        value={clientDetail.last_name}
                                                                        onChange={(e) => setClientDetail({ ...clientDetail, last_name: e.target.value })}
                                                                        required
                                                                        feedbackInvalid={"Last name is required."}
                                                                        className={'form-control is_not_validated'}
                                                                        id="floatingInput2"
                                                                        placeholder="Last Name"
                                                                    />
                                                                    <label htmlFor="floatingInput2">Last Name</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                    }
                                    {
                                        showFullDetail &&
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        value={clientDetail.abn_number}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, abn_number: e.target.value })}
                                                        type="text"
                                                        className="form-control"
                                                        id="floatingInput6"
                                                        placeholder="ABN number"
                                                    />
                                                    <label htmlFor="floatingInput6">ABN number</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        type="text"
                                                        value={clientDetail.preferred_name}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, preferred_name: e.target.value })}
                                                        className="form-control"
                                                        id="floatingInput7"
                                                        placeholder="Preferred Name"
                                                    />
                                                    <label htmlFor="floatingInput7">Preferred Name</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        type="text"
                                                        minlength="10"
                                                        maxlength="13"
                                                        value={clientDetail.phone}
                                                        onChange={(e) => {
                                                            const inputValue = e.target.value;
                                                            const numericValue = inputValue.replace(/[^\d+]/g, '');
                                                            setClientDetail({ ...clientDetail, phone: numericValue });
                                                        }}
                                                        feedbackInvalid='Enter valid phone number'
                                                        className="form-control"
                                                        id="floatingInput8"
                                                        placeholder="Phone Number"
                                                    />
                                                    <label htmlFor="floatingInput8">Phone Number</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        type="email"
                                                        value={clientDetail.email}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, email: e.target.value })}
                                                        className="form-control email-input"
                                                        id="floatingInput9"
                                                        placeholder="Email Address"
                                                        feedbackInvalid='Enter valid email address'
                                                    />
                                                    <label htmlFor="floatingInput9">Email Address</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        type="text"
                                                        value={clientDetail.client_code}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, client_code: e.target.value })}
                                                        className="form-control"
                                                        id="floatingInput10"
                                                        placeholder="Client Code"
                                                    />
                                                    <label htmlFor="floatingInput10">Client Code</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <CFormInput
                                                        type="text"
                                                        value={clientDetail.user_defined}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, user_defined: e.target.value })}
                                                        className="form-control"
                                                        id="floatingInput11"
                                                        placeholder="User Defined"
                                                    />
                                                    <label htmlFor="floatingInput11">User Defined</label>
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="form-floating">
                                                    <textarea
                                                        value={clientDetail.address}
                                                        onChange={(e) => setClientDetail({ ...clientDetail, address: e.target.value })}
                                                        style={{ height: "80px" }}
                                                        className="form-control"
                                                        id="floatingInput13"
                                                        placeholder="Address">
                                                    </textarea>
                                                    <label htmlFor="floatingInput13">Address</label>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn close_btn" data-bs-dismiss="modal">Close</button>
                                {!editMode &&
                                    <button type="button" className="btn common_btn" onClick={() => setShowFullDetail(!showFullDetail)}>{showFullDetail ? `Hide Full Detail` : `Full Client Detail`}</button>
                                }
                                <button type="submit" className="btn common_btn">Save</button>
                            </div>
                        </CForm>
                    </div>
                </div>
            </div >
        </>
    );
}

export default AddClient;


