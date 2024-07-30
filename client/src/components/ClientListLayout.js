import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { useNavigate } from 'react-router-dom';

const ClientListLayout = () => {
    const navigate = useNavigate();
    const { toast, logout } = useAuth()
    const [showMenu, setShowMenu] = useState(false)

    const handleLogout = () => {
        logout()
        navigate("/")
    }
    return (
        <>
            <Toast ref={toast} />
            <section className="main_header">
                <header>
                    <div className="container">
                        <div className="header_flex">
                            <div className="main_logo">
                                <a href="#"><img src="/images/accoutn_logo.svg" alt="" /></a>
                            </div>
                            <div className="login_box_top pos_rel">
                                <button onClick={() => setShowMenu(!showMenu)}>
                                    <img src="/images/login_icn.svg" alt="" />
                                    <span> Login</span>
                                    <img className="login_click" src="/images/down_white.svg" alt="" />
                                </button>
                                <div className={`login_open ${showMenu ? 'd-block' : 'd-none'}`}>
                                    <button onClick={() => handleLogout()}>Logout</button>
                                    <button >Logout</button>
                                    <button>Logout</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
        </>
    )
}

export default ClientListLayout
