import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useClient } from '../contexts/ClientContexts';
import { Tooltip } from 'bootstrap';

const Layout = ({ children }) => {
    const { toast, logout, auth } = useAuth()
    const { getAllClients, clientsAvalible, setClientsAvalible } = useClient()
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    const toggleSubmenu = () => {
        setIsSubmenuOpen(!isSubmenuOpen);
    };

    const user_name = auth?.user?.first_name.length > 7 ? `${auth?.user?.first_name.slice(0, 5)}...` : auth?.user?.first_name

    const handleLogout = () => {
        logout()
        navigate("/")
    }

    const checkForClients = async () => {
        const clientList = await getAllClients(1, 1, "", "", "");

        if (clientList?.clients?.length !== 0) {
            setClientsAvalible(true);
        } else {
            setClientsAvalible(false);
        }
    }

    useEffect(() => {
        checkForClients();
    }, []);

    useEffect(() => {
        const tooltipElements = [
            document.getElementById('uploadCsvLink'),
            document.getElementById('chartOfAccountsLink'),
            document.getElementById('spreadsheetLink'),
            document.getElementById('autoCategorizeLink'),
            document.getElementById('gstReportLink'),
            document.getElementById('itrReportLink'),
            document.getElementById('reportLink'),
        ];

        if (!clientsAvalible) {
            tooltipElements.forEach((element) => {
                if (element) {
                    new Tooltip(element, {
                        title: 'Clients are not available',
                        placement: 'bottom',
                        trigger: 'hover',
                    });
                }
            });
        } else {
            tooltipElements.forEach((element) => {
                if (element) {
                    Tooltip.getInstance(element)?.dispose();
                }
            });
        }
    }, [clientsAvalible]);



    return (
        <div className='main_layout'>
            <section className="client_list_section spreadsheet">
                <div>
                    <div className="bg_white_box mt-20 p-0">
                        <div className="main_part_box wrapper">
                            <div id="sidebar" ref={sidebarRef}>
                                <div className="side_data">
                                    <ul>
                                        <Link to={"/"} className='header_logo px-2 d-flex justify-content-center mb-3'>
                                            <img src="/images/accoutn_logo_3.png" alt="" />
                                        </Link>
                                        {auth.user.role === 'user' ? (
                                            <>
                                                <li className='mt-2'>
                                                    <Link to={'/user/category'} className={location.pathname.match("/user/category") && `selected`}>
                                                        <Icon icon="f7:menu" className='btn_icon' />Category
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link to={'/user/clients'} className={location.pathname.match("/user/clients") && `selected`}>
                                                        <Icon icon="solar:user-bold" className='btn_icon' />{user_name}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        id="uploadCsvLink"
                                                        to={'/user/upload-csv'}
                                                        className={location.pathname.match("/user/upload-csv") && `selected`}
                                                        onClick={(e) => {
                                                            if (!clientsAvalible) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!clientsAvalible}
                                                    >
                                                        <Icon icon="mynaui:upload" className='btn_icon' />Upload CSV
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        id="chartOfAccountsLink"
                                                        to={'/user/chart-of-accounts'}
                                                        className={location.pathname.match("/user/chart-of-accounts") && `selected`}
                                                        onClick={(e) => {
                                                            if (!clientsAvalible) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!clientsAvalible}
                                                    >
                                                        <Icon icon="carbon:account" className='btn_icon' />Chart Of Accounts
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        id="spreadsheetLink"
                                                        to={'/user/spreadsheet'}
                                                        className={location.pathname.match("/user/spreadsheet") && `selected`}
                                                        onClick={(e) => {
                                                            if (!clientsAvalible) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!clientsAvalible}
                                                    >
                                                        <Icon icon="file-icons:microsoft-excel" className='btn_icon' />Spreadsheet
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        id="autoCategorizeLink"
                                                        to={'/user/auto-categorize'}
                                                        className={location.pathname.match("/user/auto-categorize") && `selected`}
                                                        onClick={(e) => {
                                                            if (!clientsAvalible) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!clientsAvalible}
                                                    >
                                                        <Icon icon="uil:chart-growth" className='btn_icon' />Auto Categorize
                                                    </Link>
                                                </li>
                                                <li><Link>
                                                    <Icon icon="mdi:bank" className='btn_icon' />Inter Bank Transfer
                                                </Link></li>
                                                <li className='report_dropdown'>
                                                    <span
                                                        onClick={(e) => {
                                                            if (!clientsAvalible) {
                                                                e.preventDefault();
                                                            } else {
                                                                toggleSubmenu()
                                                            }
                                                        }}
                                                        disabled={!clientsAvalible}
                                                        id="reportLink"
                                                        className="dropdown_trigger"
                                                    >
                                                        <Icon icon="fluent:arrow-growth-24-filled" className='btn_icon' />Reports
                                                        <Icon icon={`ep:arrow-${isSubmenuOpen ? 'up' : 'down'}-bold`} className='icon_for_btn dropdown_icn' style={{ color: 'white' }} />
                                                    </span>
                                                    {isSubmenuOpen && (
                                                        <ul className="submenu">
                                                            <li>
                                                                <Link
                                                                    id="gstReportLink"
                                                                    to={'/user/gst-report'}
                                                                    className={location.pathname.match("/user/gst-report") && `selected`}
                                                                    onClick={(e) => {
                                                                        if (!clientsAvalible) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    disabled={!clientsAvalible}
                                                                >
                                                                    <Icon icon="hugeicons:taxes" className='btn_icon' />GST Report
                                                                </Link>
                                                            </li>
                                                            <li>
                                                                <Link
                                                                    id="itrReportLink"
                                                                    to={'/user/itr-report'}
                                                                    className={location.pathname.match("/user/itr-report") && `selected`}
                                                                    onClick={(e) => {
                                                                        if (!clientsAvalible) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    disabled={!clientsAvalible}
                                                                >
                                                                    <Icon icon="lsicon:report-filled" className='btn_icon' />ITR Report
                                                                </Link>
                                                            </li>
                                                        </ul>
                                                    )}
                                                </li>
                                            </>
                                        ) : (
                                            <li><Link to={'/admin/users'} className={location.pathname.match("/admin/users") && `selected`}>Home</Link></li>
                                        )}
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

export default Layout;
