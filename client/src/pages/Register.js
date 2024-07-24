import { CForm, CFormInput } from '@coreui/react'
import React from 'react'

const Register = () => {
    return (
        <>
            <section className="main_header login_header">
                <header>
                    <div className="container">
                        <div className="main_logo">
                            <a href="#"><img src="/images/accoutn_logo.svg" alt="" /></a>
                        </div>
                    </div>
                </header>
            </section>
            <section className='login_center_box'>
                <div className="wid700">
                    <h1>Registration</h1>
                    <div className='bg_white_box'>
                        <div className='special_login_box'>
                            <div className='row justify-content-center'>
                                <div className='col-md-6'>
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/google_icn.svg" alt="" />
                                        <span>Sign in with Google</span>
                                    </a>
                                </div>
                                <div className="col-md-6">
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/microsoft_icn.svg" alt="" />
                                        <span>Sign in with Microsoft</span>
                                    </a>
                                </div>
                                <div className="col-md-6">
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/apple_icn.svg" alt="" />
                                        <span>Sign in with Apple</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="brd_or_center">
                            <div className="or_center">OR</div>
                        </div>
                        <div className='input_form_box'>
                            <CForm>
                                <div className='row'>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="email"
                                                required
                                                feedbackInvalid={"Email is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingEmail"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingEmail">Email Address</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                required
                                                feedbackInvalid={"First name is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingFirstName"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingFirstName">First Name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                required
                                                feedbackInvalid={"Last name is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingLastName"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingLastName">Last Name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                required
                                                feedbackInvalid={"Phone number is required."}
                                                className={'form-control'}
                                                id="floatingPhoneNumber"
                                                placeholder="Phone Number"
                                            />
                                            <label htmlFor="floatingPhoneNumber">Phone Number</label>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="common_btn d-flex m-auto">Create Account</button>
                            </CForm>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Register