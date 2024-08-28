import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { CForm, CFormInput } from '@coreui/react';
import { Toast } from 'primereact/toast';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const { toast, signUp, signUpUserByGoogle } = useAuth();
    const { instance } = useMsal();
    const navigate = useNavigate();

    const [userDetails, setUserDetails] = useState({
        email: "",
        first_name: "",
        last_name: "",
        phone: ""
    });
    const [validated, setValidated] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault()
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
                const data = await signUp(userDetails);
                if (data.error === false) {
                    navigate("/thanks")
                }
                console.log(data);
            } catch (error) {
                console.log(error);
            }
        }
    }

    const handleGoogleSignUp = async (res) => {
        try {
            const { access_token } = res;
            const { data } = await axios.get(process.env.REACT_APP_OAUTH2_GOOGLE_API,
                {
                    headers:
                    {
                        Authorization: `Bearer ${access_token}`
                    }
                })

            if (typeof data !== 'undefined') {
                if (data.email_verified) {
                    const { given_name, family_name, email } = data

                    const googleSignUp = await signUpUserByGoogle(given_name, family_name, email)
                    if (!googleSignUp?.error) {
                        navigate("/login")
                    }
                } else {
                    toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: 'An error occurred. Please try again later.', life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    };

    const googleSignUp = useGoogleLogin({
        onSuccess: handleGoogleSignUp,
    });

    const handleMicrosoftSignUp = async () => {
        try {
            const loginResponse = await instance.loginPopup({
                scopes: ['user.read'],
                prompt: 'select_account'
            });

            const accessToken = loginResponse.accessToken;
            const { data } = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            console.log(data);

            const { givenName, surname, userPrincipalName } = data;
            const email = userPrincipalName.replace('_', '@').split('#')[0];

            const microsoftSignUp = await signUpUserByGoogle(givenName, surname, email); // Reuse the same function or create a new one for Microsoft
            if (!microsoftSignUp?.error) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error during Microsoft login:', error);
        }
    };

    return (
        <>
            <Toast ref={toast} />
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
                                    <div onClick={() => googleSignUp()} className="brd_green_box">
                                        <img src="/images/google_icn.svg" alt="" />
                                        <span>Sign up with google</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div onClick={handleMicrosoftSignUp} className="brd_green_box">
                                        <img src="/images/microsoft_icn.svg" alt="" />
                                        <span>Sign up with microsoft</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div href="#" className="brd_green_box">
                                        <img src="/images/apple_icn.svg" alt="" />
                                        <span>Sign up with apple</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="brd_or_center">
                            <div className="or_center">OR</div>
                        </div>
                        <div className='input_form_box'>
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className='row'>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="email"
                                                value={userDetails.email}
                                                onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                                required
                                                feedbackInvalid={"Email is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingEmail"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingEmail">Email address</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                value={userDetails.first_name}
                                                onChange={(e) => setUserDetails({ ...userDetails, first_name: e.target.value })}
                                                required
                                                feedbackInvalid={"First name is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingFirstName"
                                                placeholder="First Name"
                                            />
                                            <label htmlFor="floatingFirstName">First name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                value={userDetails.last_name}
                                                onChange={(e) => setUserDetails({ ...userDetails, last_name: e.target.value })}
                                                required
                                                feedbackInvalid={"Last name is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingLastName"
                                                placeholder="Last Name"
                                            />
                                            <label htmlFor="floatingLastName">Last name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="text"
                                                minLength="10"
                                                maxLength="13"
                                                value={userDetails.phone}
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    const numericValue = inputValue.replace(/[^\d+]/g, '');
                                                    setUserDetails({ ...userDetails, phone: numericValue })
                                                }}
                                                required
                                                feedbackInvalid={"Phone number is required."}
                                                className={'form-control'}
                                                id="floatingPhoneNumber"
                                                placeholder="Phone Number"
                                            />
                                            <label htmlFor="floatingPhoneNumber">Phone number</label>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="common_btn d-flex m-auto">Create account</button>
                            </CForm>
                            <div className="sign-up">
                                <span>Already have an account?</span>
                                <Link to='/'>Sign in</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Register;
