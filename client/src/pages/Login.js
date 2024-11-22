import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { CFormInput, CForm } from '@coreui/react';
import { useGoogleLogin } from "@react-oauth/google";
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '@iconify/react';

const Login = () => {
    const { auth, login, toast, loginUserByGoogle } = useAuth();
    const { instance } = useMsal();
    const location = useLocation()

    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    })
    const [validated, setValidated] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const navigate = useNavigate()

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
                await login(credentials);
            } catch (error) {
                console.log(error);
            }
        }
    };

    const handleGoogleSignInSuccess = async (res) => {
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
                    const { email } = data

                    const googleLogin = await loginUserByGoogle(email)
                    if (!googleLogin?.error) {
                        navigate("/")
                    }
                } else {
                    toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    };

    const googleSignIn = useGoogleLogin({
        onSuccess: handleGoogleSignInSuccess,
    });

    const handleMicrosoftSignIn = async () => {
        try {
            const loginResponse = await instance.loginPopup({
                scopes: ['user.read'],
                prompt: 'select_account'
            });

            const accessToken = loginResponse.accessToken;
            const { data } = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const { userPrincipalName } = data;
            const email = userPrincipalName.replace('_', '@').split('#')[0];

            const microsoftLogin = await loginUserByGoogle(email); // Assuming you have a loginUserByMicrosoft function
            if (!microsoftLogin?.error) {
                navigate('/');
            }
        } catch (error) {
            console.error('Error during Microsoft login:', error);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            location.pathname !== '/' ? navigate(location.pathname) : (auth.user.role === "admin" ? navigate('/admin/users') : navigate('/user/clients'));
        }
    }, [auth?.token, navigate]);

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
                        <div className='container_body'>
                            <div className='logo_container'>
                                <div className='google_icn_container' onClick={() => googleSignIn()}>
                                    <img className='mb-3 google_logo' src="/images/google_logo.svg" alt="" />
                                    <span className='text-center'>Google</span>
                                </div>
                                <div className='google_icn_container' onClick={handleMicrosoftSignIn}>
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
                                        <label htmlFor="floatingEmail" className='pb-2 credential_label'>Email</label>
                                        <CFormInput
                                            type="email"
                                            value={credentials.email}
                                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                            required
                                            feedbackInvalid={"Email is required."}
                                            className={'is_not_validated credential_input'}
                                            id="floatingEmail"
                                        />
                                    </div>
                                    <div className="col-md-6 position-relative mt-3">
                                        <label htmlFor="floatingPassword" className='pb-2 credential_label'>Password</label>
                                        <CFormInput
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            type={passwordVisible ? 'text' : 'password'}
                                            required
                                            feedbackInvalid={"Password is required."}
                                            className={'form-control is_not_validated credential_input'}
                                            id="floatingPassword"
                                        />
                                        <button
                                            type="button"
                                            className="password-visiblity"
                                            onClick={() => setPasswordVisible(!passwordVisible)}
                                        >
                                            <Icon icon={passwordVisible ? 'ph:eye-slash' : 'ph:eye'} width={30} height={30} />
                                        </button>
                                    </div>
                                    <div className='checks_container'>
                                        <div className="col-md-6">
                                            <div className="check_box mt-2">
                                                <input className="styled-checkbox checkbox-hover" id="styled-checkbox-2" type="checkbox" value="value2" />
                                                <label htmlFor="styled-checkbox-2" className='green_label'>Keep Me Signed In</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="sign-up mt-2">
                                                <Link to='forgot-password' className="forgot_psw green_label">Forgot Password?</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="lined_btn d-flex mx-auto login_btn">Login</button>
                                </div>
                            </CForm>
                            <div className="sign-up">
                                <span>Don’t Have An Account?</span>
                                <Link to='/register' className='mt-3 green_label' >Sign Up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login
