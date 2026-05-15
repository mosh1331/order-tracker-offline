import React from 'react'
import OrderSync from '../order/OrderSync'
import SyncFromCloud from '../order/SyncFromCloud'

const Settings = () => {
    return (
        <main className="animate-in">
            <div style={{ padding: '0 20px', marginBottom: '20px', }}>
                <h2>Settings</h2>
               <div>
                 <OrderSync />
                <SyncFromCloud />
               </div>
            </div>
        </main>
    )
}

export default Settings