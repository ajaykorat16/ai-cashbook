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
                    navigate("/")
                }
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
                        navigate("/")
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

            const { givenName, surname, userPrincipalName } = data;
            const email = userPrincipalName.replace('_', '@').split('#')[0];

            const microsoftSignUp = await signUpUserByGoogle(givenName, surname, email); // Reuse the same function or create a new one for Microsoft
            if (!microsoftSignUp?.error) {
                navigate('/');
            }
        } catch (error) {
            console.error('Error during Microsoft login:', error);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className='login_page'>
                <section className="main_header login_header">
                    <header>
                        <div className="container">
                            <div className="main_logo">
                                <img className='web_logo' src="/images/accoutn_logo.svg" alt="" />
                            </div>
                        </div>
                    </header>
                </section>
                <div className='container d-flex col login_container'>
                    <div className='first_container'>
                        <img className='img-responsive login_img' src="/images/login.png" alt="" />
                    </div>
                    <div className='second_container'>
                        <div className='singnin_text text-center'>
                            SIGN IN
                        </div>
                        <div>
                            <div className='logo_container'>
                                <div className='google_icn_container' onClick={() => googleSignUp()}>
                                    <img className='mb-3 google_logo' src="/images/google_logo.svg" alt="" />
                                    <span className='text-center'>Google</span>
                                </div>
                                <div className='google_icn_container' onClick={handleMicrosoftSignUp}>
                                    <img className='mb-3 google_logo' src="/images/microsoft_logo.svg" alt="" />
                                    <span className='text-center'>Microsoft</span>
                                </div>
                                <div className='google_icn_container'>
                                    <img className='mb-3 google_logo' src="/images/apple_logo.svg" alt="" />
                                    <span className='text-center'>Apple</span>
                                </div>
                            </div>
                            <div className='justify-content-center d-flex'>
                                <div class="line-with-verticals"></div>
                            </div>
                            <CForm onSubmit={handleSubmit} noValidate validated={validated} className='d-flex justify-content-center'>
                                <div className='row credentials_container'>
                                    <div className="col-md-6 mt-3">
                                        <label htmlFor="floatingEmail" className='pb-2 credential_label'>Email Address</label>
                                        <CFormInput
                                            type="email"
                                            value={userDetails.email}
                                            onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                            required
                                            feedbackInvalid={"Email is required."}
                                            className={'form-control is_not_validated credential_input'}
                                            id="floatingEmail"
                                        />
                                    </div>
                                    <div className="col-md-6 mt-3">
                                        <label htmlFor="floatingFirstName" className='pb-2 credential_label'>First Name</label>
                                        <CFormInput
                                            type="text"
                                            value={userDetails.first_name}
                                            onChange={(e) => setUserDetails({ ...userDetails, first_name: e.target.value })}
                                            required
                                            feedbackInvalid={"First name is required."}
                                            className={'form-control is_not_validated credential_input'}
                                            id="floatingFirstName"
                                        />
                                    </div>
                                    <div className="col-md-6 mt-3">
                                        <label htmlFor="floatingLastName" className='pb-2 credential_label'>Last Name</label>
                                        <CFormInput
                                            type="text"
                                            value={userDetails.last_name}
                                            onChange={(e) => setUserDetails({ ...userDetails, last_name: e.target.value })}
                                            required
                                            feedbackInvalid={"Last name is required."}
                                            className={'form-control is_not_validated credential_input'}
                                            id="floatingLastName"
                                        />
                                    </div>
                                    <div className="col-md-6 mt-3">
                                        <label htmlFor="floatingPhoneNumber" className='pb-2 credential_label'>Phone Number</label>
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
                                            className={'form-control credential_input'}
                                            id="floatingPhoneNumber"
                                        />
                                    </div>
                                    <button type="submit" className="lined_btn d-flex mx-auto login_btn">Sign up</button>
                                </div>
                            </CForm>
                            <div className="sign-up">
                                <span>Already have an account?</span>
                                <Link to='/' className='mt-3'>Sign In</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;
