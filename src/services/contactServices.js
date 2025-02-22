const { Op } = require("sequelize");
const Contact = require("../models/contactModel");

// Function to identify and reconcile contacts
async function identifyContact(email, phoneNumber) {
  // Fetch contacts with matching email or phoneNumber
  const contacts = await Contact.findAll({
    where: {
      [Op.or]: [{ email }, { phoneNumber }],
    },
  });

  let primaryContact = contacts.find(c => c.linkPrecedence === "primary");

  if (!primaryContact) {
    // No existing contacts, create a new primary contact
    const newContact = await Contact.create({
      email,
      phoneNumber,
      linkPrecedence: "primary",
    });

    return formatResponse(newContact, []);
  }

  // Collect secondary contacts linked to the primary
  const secondaryContacts = contacts.filter(c => c.id !== primaryContact.id);

  // Check if the email/phone is entirely new (not in any existing contact)
  const isNewContact = !contacts.some(
    c => c.email === email || c.phoneNumber === phoneNumber
  );

  if (isNewContact) {
    // Create a secondary contact if the new details do not exist
    const newSecondary = await Contact.create({
      email,
      phoneNumber,
      linkedId: primaryContact.id,
      linkPrecedence: "secondary",
    });
    secondaryContacts.push(newSecondary);
  }

  return formatResponse(primaryContact, secondaryContacts);
}

// Function to structure the response
function formatResponse(primaryContact, secondaryContacts) {
  return {
    contact: {
      primaryContactId: primaryContact.id, // Fixed typo here
      emails: [
        primaryContact.email,
        ...new Set(secondaryContacts.map(c => c.email)),
      ].filter(Boolean),
      phoneNumbers: [
        primaryContact.phoneNumber,
        ...new Set(secondaryContacts.map(c => c.phoneNumber)),
      ].filter(Boolean),
      secondaryContactIds: secondaryContacts.map(c => c.id),
    },
  };
}

module.exports = { identifyContact };
