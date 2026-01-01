import logoImage from '../assets/icons/logo.png';
import eyeImage from '../assets/icons/eye.png';
import emailImage from '../assets/icons/email.png';
import usernameImage from '../assets/icons/username.png';
import walletImage from '../assets/icons/wallet.png';
import walletFilledImage from '../assets/icons/walletFilled.png';
import withdrawImage from '../assets/icons/withdraw.png';
import recentImage from '../assets/icons/recent.png';
import storeImage from '../assets/icons/store.png';
import addMoneyImage from '../assets/icons/plus.png';
import payPeopleImage from '../assets/icons/pay.png';
import searchImage from '../assets/icons/search.png';
import arrowBackImage from '../assets/icons/arrowBack.png';
import flipCameraImage from '../assets/icons/cameraFlip.png';
import imageUploadImage from '../assets/icons/browse.png';
import filterImage from '../assets/icons/filter.png';
import dropdownImage from '../assets/icons/dropdown.png';
import ReceiptImage from '../assets/icons/receipt.png';
import GroceryStoreImage from '../assets/icons/grocery-store.png';

const ActionIconWrapper = ({ children }) => (
  <div className="w-12 h-12 bg-[#1c86c8] rounded-full flex items-center justify-center shadow-md">
    {children}
  </div>
);

export const WalletIcon = () => (
  <img 
    src={walletImage} 
    alt="Wallet Icon" 
    className='w-7 h-7'
  />
);

export const CheckBalanceIcon = () => (
  <ActionIconWrapper>
    <img  
      src={walletFilledImage} 
      alt="Wallet Filled Icon" 
      className='w-5 h-5'
    />
  </ActionIconWrapper>  
);

export const WithdrawIcon = () => (
  <ActionIconWrapper>
    <img 
      src={withdrawImage}
      alt="Withdraw Icon"
      className='w-5 h-5'
    />
  </ActionIconWrapper>
);  

export const RecentIcon = () => (
  <ActionIconWrapper>
    <img 
      src={recentImage} 
      alt="Recent Icon"
      className='w-5 h-5'
    />
  </ActionIconWrapper>
);

export const SearchStoresIcon = () => (
  <ActionIconWrapper>
    <img 
      src={storeImage}
      alt="Store Icon"
      className='w-5 h-5'
    />
  </ActionIconWrapper>  
);

export const ReceiptIcon = () => (
  <img 
    src={ReceiptImage}
    alt="Receipt Icon"
    className='w-5 h-5'
  />
);

export const ShoppingCartIcon = () => (
  <img 
    src={GroceryStoreImage}
    alt="Grocery Store Icon"
    className='w-6 h-6'
  />
);

export const AddMoneyIcon = () => (
  <ActionIconWrapper>
    <img 
      src={addMoneyImage}
      alt="Add Money Icon"
      className='w-5 h-5'
    />
  </ActionIconWrapper>
  
);

export const PayPeopleIcon = () => (
  <ActionIconWrapper>
    <img 
      src={payPeopleImage}
      alt="Pay People Icon"
      className='w-5 h-5'
    />
  </ActionIconWrapper>  
);

export const EmailIcon = () => (
  <img
    src={emailImage}
    alt="Email Icon"
    className='w-7 h-7'
  />
);

export const UserNameIcon = () => (
  <img
    src={usernameImage} 
    alt='Username Icon'
    className='w-7 h-7'
  />
);

export const SearchIcon = () => (
  <img 
    src={searchImage}
    alt="Search Icon"
    className='w-5 h-5'
  />
);

export const FilterIcon = () => (
  <img 
    src={filterImage}
    alt="Filter Icon"
    className='w-5 h-5'
  />
);  

export const DropdownIcon = () => (
  <img 
    src={dropdownImage}
    alt="Dropdown Icon"
    className='w-5 h-5'
  />
);

export const EyeIcon = ({ onClick, isVisible }) => (
  <img 
    src={eyeImage} 
    alt="Toggle Password Visibility"
    onClick={onClick}
    className={`w-8 h-8 cursor-pointer transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-20'
    }`}
  />
);

export const LogoIcon = () => (
  <img 
    src={logoImage} 
    alt="CashPay Logo" 
    className="w-16 h-16 rounded-xl shadow-sm object-cover" 
  />
);

export const ArrowBackIcon = () => (
  <img 
    src={arrowBackImage} 
    alt="Arrow Back Icon" 
    className="w-6 h-6"
  />
);

export const FlipCameraIcon = () => (
  <img 
    src={flipCameraImage} 
    alt="Flip Camera Icon" 
    className="w-6 h-6"
  />
);

export const ImageIcon = () => (
  <img 
    src={imageUploadImage}
    alt="Image Upload Icon" 
    className="w-6 h-6"
  />
);