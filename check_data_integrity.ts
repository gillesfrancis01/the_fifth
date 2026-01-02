
import getAllReservations from './src/app/actions/getAllReservations';
import getAllCustomers from './src/app/actions/getAllCustomers';

async function checkData() {
    console.log('Fetching reservations...');
    const reservations = await getAllReservations();
    console.log(`Fetched ${reservations.length} reservations.`);

    // Check for duplicates
    const idCounts = new Map<string, number>();
    reservations.forEach(r => {
        idCounts.set(r.$id, (idCounts.get(r.$id) || 0) + 1);
    });

    const duplicates = [...idCounts.entries()].filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
        console.log('Duplicate Reservation IDs found (Should be impossible for Appwrite):', duplicates);
    } else {
        console.log('No duplicate Reservation IDs found.');
    }

    // Check for duplicate customer bookings (logic: same customer, same ticket, same time?)
    // This helps identify if the user's "duplication" is logical duplication
    console.log('Checking for logical duplicates (Same Customer, Same CreatedAt)...');
    const logicalMap = new Map<string, any[]>();
    reservations.forEach(r => {
        const key = `${r.customer_ID}-${r.$createdAt}`;
        if (!logicalMap.has(key)) logicalMap.set(key, []);
        logicalMap.get(key).push(r);
    });

    [...logicalMap.entries()].filter(([key, list]) => list.length > 1).forEach(([key, list]) => {
        console.log(`Logical Duplicate found for key ${key}:`);
        list.forEach(r => console.log(` - ID: ${r.$id}, Customer: ${r.customer_ID}, Ticket: ${r.ticket_ID}`));
    });

    console.log('Fetching customers...');
    const customers = await getAllCustomers();
    console.log(`Fetched ${customers.length} customers.`);

    // Check for missing customers in reservations
    let unknownClients = 0;
    reservations.forEach(r => {
        const customer = customers.find(c => c.$id === r.customer_ID);
        if (!customer) {
            // console.log(`Reservation ${r.$id} has unknown customer ${r.customer_ID}`);
            unknownClients++;
        }
    });
    console.log(`Total reservations with unknown customers (in top 1000 fetch): ${unknownClients}`);
}

checkData().catch(console.error);
