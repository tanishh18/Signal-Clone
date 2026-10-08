from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contact, User
from app.auth import get_current_user
from app.schemas import ContactCreate, ContactResponse

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactResponse])
def get_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the authenticated user's contact list with contact details.
    """
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    return [ContactResponse.model_validate(c) for c in contacts]


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(payload: ContactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Adds a user to the authenticated user's contacts.
    Prevents self-contact and duplicate contacts.
    """
    if payload.contact_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a contact."
        )

    target_user = db.query(User).filter(User.id == payload.contact_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_id == payload.contact_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That user is already in your contacts."
        )

    new_contact = Contact(
        user_id=current_user.id,
        contact_id=payload.contact_id,
        nickname=payload.nickname.strip() if payload.nickname else None
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return ContactResponse.model_validate(new_contact)


@router.delete("/{contact_id}")
def delete_contact(contact_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Removes a contact from the authenticated user's contact list.
    Preserves all user accounts, conversations, and historical messages.
    """
    contact = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_id == contact_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found in your address book."
        )

    db.delete(contact)
    db.commit()
    return {"message": "Contact removed successfully."}
