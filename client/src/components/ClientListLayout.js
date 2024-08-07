import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { Link, useNavigate } from 'react-router-dom';
import ClientSelection from './ClientSelection';

const ClientListLayout = ({ children, showSlection }) => {
    const navigate = useNavigate();
    const { toast, logout, auth } = useAuth()
    const user_name = auth?.user?.first_name.length > 7 ? `${auth?.user?.first_name.slice(0, 5)}...` : auth?.user?.first_name
    const [showMenu, setShowMenu] = useState(false)
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const slidebarArrowRef = useRef(null);

    const handleLogout = () => {
        logout()
        navigate("/")
    }

    useEffect(() => {
        const handleToggle = () => {
            if (window.innerWidth > 768) {
                sidebarRef.current.classList.toggle('active');
                contentRef.current.classList.toggle('active');
            } else {
                sidebarRef.current.style.display = sidebarRef.current.style.display === 'none' ? 'block' : 'none';
            }
        };

        const slidebarArrow = slidebarArrowRef.current;
        slidebarArrow.addEventListener('click', handleToggle);

        return () => {
            slidebarArrow.removeEventListener('click', handleToggle);
        };
    }, []);
    return (
        <>
            <Toast ref={toast} />
            <section className="main_header">
                <header>
                    <div className="container">
                        <div className="header_flex">
                            <div className="main_logo">
                                <Link to={"/"}>
                                    <img src="/images/accoutn_logo.svg" alt="" />
                                </Link>
                            </div>
                            <div className="right_head">
                                {
                                    showSlection && (
                                        <ClientSelection className="head_select" />
                                    )
                                }
                                <div className="login_box_top pos_rel">
                                    <button onClick={() => setShowMenu(!showMenu)}>
                                        <img src="/images/login_icn.svg" alt="" />
                                        <span>
                                            {user_name}
                                        </span>
                                        <img className="login_click" src="/images/down_white.svg" alt="" />
                                    </button>
                                    <div className={`login_open ${showMenu ? 'd-block' : 'd-none'}`}>
                                        <button onClick={() => handleLogout()}>Logout</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
            <section className="client_list_section spredsheet">
                <div className="container">
                    <div className="bg_white_box m-20 p-0">
                        <div className="main_part_box wrapper">
                            <div id="sidebar" ref={sidebarRef}>
                                <div className="side_data">
                                    <ul>
                                        <li><Link to={'/user/clients'} className="selected">Home</Link></li>
                                        <li><Link>Upload CSV</Link></li>
                                        <li><Link to={'/user/chart-of-accounts'}>Chat of Accounts</Link></li>
                                        <li><Link>Auto Categorize</Link></li>
                                        <li><Link>Check inter-bank transfer</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div id="content" ref={contentRef}>
                                <div className="slidebar_arrow" ref={slidebarArrowRef}><img src="/images/menu.svg" alt="" /></div>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ClientListLayout
