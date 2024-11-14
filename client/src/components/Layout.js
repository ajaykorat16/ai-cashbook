import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ClientSelection from './ClientSelection';
import { useClient } from '../contexts/ClientContexts';
import { Icon } from '@iconify/react';

const Layout = ({ children, showSelection = false }) => {
    const { toast, logout, auth } = useAuth()
    const { clientObject } = useClient()
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const slidebarArrowRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false)

    const user_name = auth?.user?.first_name.length > 7 ? `${auth?.user?.first_name.slice(0, 5)}...` : auth?.user?.first_name

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
                    <div>
                        <div className="header_flex">
                            <div className="main_logo">
                                <Link to={"/"}>
                                    <img src="/images/accoutn_logo.svg" alt="" />
                                </Link>
                            </div>
                            <div className="right_head">
                                {
                                    showSelection && (
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
                <div>
                    <div className="bg_white_box mt-20 p-0">
                        <div className="main_part_box wrapper">
                            <div id="sidebar" ref={sidebarRef}>
                                <div className="side_data">
                                    <ul>
                                        {auth.user.role === 'user' ? (
                                            <>
                                                <li><Link to={'/user/clients'} className={location.pathname.match("/user/clients") && `selected`}>
                                                    <i className="pi pi-home btn_icon" style={{ color: 'white' }}></i>Home
                                                </Link></li>
                                                <li><Link to={'/user/category'} className={location.pathname.match("/user/category") && `selected`}>
                                                    <i className="pi pi-bars btn_icon" style={{ color: 'white' }}></i>Category
                                                </Link></li>
                                                <li><Link to={'/user/upload-csv'} className={location.pathname.match("/user/upload-csv") && `selected`}>
                                                    <i className="pi pi-upload btn_icon" style={{ color: 'white' }}></i>Upload CSV
                                                </Link></li>
                                                {clientObject?.value && (
                                                    <>
                                                        <li><Link to={'/user/chart-of-accounts'} className={location.pathname.match("/user/chart-of-accounts") && `selected`}>
                                                            <i className="pi pi-address-book btn_icon" style={{ color: 'white' }}></i>Chart of accounts
                                                        </Link></li>
                                                        <li><Link to={'/user/auto-categorize'} className={location.pathname.match("/user/auto-categorize") && `selected`}>
                                                            <i className="pi pi-chart-bar btn_icon" style={{ color: 'white' }}></i>Auto categorize
                                                        </Link></li>
                                                        <li><Link to={'/user/gst-report'} className={location.pathname.match("/user/gst-report") && `selected`}>
                                                            <i className="pi pi-calculator btn_icon" style={{ color: 'white' }}></i>GST Report
                                                        </Link></li>
                                                        <li><Link to={'/user/itr-report'} className={location.pathname.match("/user/itr-report") && `selected`}>
                                                            <i className="pi pi-file btn_icon" style={{ color: 'white' }}></i>ITR Report
                                                        </Link></li>
                                                    </>
                                                )}
                                                <li><Link>
                                                    <i className="pi pi-credit-card btn_icon" style={{ color: 'white' }}></i>Inter Bank Transfer
                                                </Link></li>
                                            </>
                                        ) : (
                                            <li><Link to={'/admin/users'} className={location.pathname.match("/admin/users") && `selected`}>Home</Link></li>
                                        )
                                        }

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

export default Layout
