import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ClientSelection from './ClientSelection';
import { useClient } from '../contexts/ClientContexts';
import { Icon } from '@iconify/react';

const Layout = ({ children }) => {
    const { toast, logout, auth } = useAuth()
    const { clientObject } = useClient()
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const slidebarArrowRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false)
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    const toggleSubmenu = () => {
        setIsSubmenuOpen(!isSubmenuOpen);
    };

    const user_name = auth?.user?.first_name.length > 7 ? `${auth?.user?.first_name.slice(0, 5)}...` : auth?.user?.first_name

    const handleLogout = () => {
        logout()
        navigate("/")
    }

    return (
        <div className='main_layout'>
            <Toast ref={toast} />
            <section className="client_list_section spredsheet">
                <div>
                    <div className="bg_white_box mt-20 p-0">
                        <div className="main_part_box wrapper">
                            <div id="sidebar" ref={sidebarRef}>
                                <div className="side_data">
                                    <ul>
                                        <Link to={"/"} className='header_logo px-2 d-flex justify-content-center mb-3'>
                                            <img src="/images/accoutn_logo_2.png" alt="" />
                                        </Link>
                                        {auth.user.role === 'user' ? (
                                            <>
                                                <li className='mt-2'><Link to={'/user/category'} className={location.pathname.match("/user/category") && `selected`}>
                                                    <Icon icon="f7:menu" className='btn_icon' />Category
                                                </Link></li>
                                                <li><Link to={'/user/clients'} className={location.pathname.match("/user/clients") && `selected`}>
                                                    <Icon icon="solar:user-bold" className='btn_icon' />{user_name}
                                                </Link></li>
                                                <li><Link to={'/user/upload-csv'} className={location.pathname.match("/user/upload-csv") && `selected`}>
                                                    <Icon icon="mynaui:upload" className='btn_icon' />Upload CSV
                                                </Link></li>
                                                <>
                                                    <li><Link to={'/user/chart-of-accounts'} className={location.pathname.match("/user/chart-of-accounts") && `selected`}>
                                                        <Icon icon="carbon:account" className='btn_icon' />Chart of accounts
                                                    </Link></li>
                                                    <li><Link to={'/user/auto-categorize'} className={location.pathname.match("/user/auto-categorize") && `selected`}>
                                                        <Icon icon="uil:chart-growth" className='btn_icon' />Auto categorize
                                                    </Link></li>

                                                </>
                                                <li><Link>
                                                    <Icon icon="mdi:bank" className='btn_icon' />Inter Bank Transfer
                                                </Link></li>
                                                <li className='report_dropdown'>
                                                    <span onClick={toggleSubmenu} className="dropdown_trigger">
                                                        <Icon icon="fluent:arrow-growth-24-filled" className='btn_icon' />Reports
                                                        <Icon icon={`ep:arrow-${isSubmenuOpen ? 'up' : 'down'}-bold`} className='icon_for_btn dropdown_icn' style={{ color: 'white' }} />
                                                    </span>
                                                    {isSubmenuOpen && (
                                                        <ul className="submenu">
                                                            <li>
                                                                <Link to={'/user/gst-report'} className={location.pathname.match("/user/gst-report") && `selected`}>
                                                                    <Icon icon="hugeicons:taxes" className='btn_icon' />GST Report
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link to={'/user/itr-report'} className={location.pathname.match("/user/itr-report") && `selected`}>
                                                                    <Icon icon="lsicon:report-filled" className='btn_icon' />ITR Report
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </li>
                                            </>
                                        ) : (
                                            <li><Link to={'/admin/users'} className={location.pathname.match("/admin/users") && `selected`}>Home</Link></li>
                                        )
                                        }

                                    </ul>

                                </div>
                                <div className='logout_btn_container'>
                                    <button className="btn logout_btn" onClick={() => handleLogout()}>
                                        Logout <Icon icon="ant-design:logout-outlined" className='logout_btn_icon' />
                                    </button>
                                </div>
                            </div>
                            <div id="content" ref={contentRef}>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Layout
