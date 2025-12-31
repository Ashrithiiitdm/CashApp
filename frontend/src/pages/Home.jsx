import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

function Home() {
    const token = localStorage.getItem("token");

    const handleLogout = async () => {
        try {
            // Sign out from Firebase
            await signOut(auth);

            // Clear localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Redirect to login
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error logging out. Please try again.");
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4">
            {token ? (
                <div className="bg-white rounded-[40px] shadow-2xl px-8 py-12 max-w-md w-full">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">
                        Welcome!
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white text-xl font-bold py-3 rounded-[20px] shadow-lg hover:bg-red-600 hover:shadow-xl active:scale-[0.98] transition-all duration-200"
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[40px] shadow-2xl px-8 py-12 max-w-md w-full text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Please log in
                    </h1>
                    <a
                        href="/login"
                        className="inline-block bg-[#1581BF] text-white text-xl font-bold py-3 px-8 rounded-[20px] shadow-lg hover:bg-[#0D6A9F] hover:shadow-xl active:scale-[0.98] transition-all duration-200"
                    >
                        Go to Login
                    </a>
                </div>
            )}
        </div>
    );
}

export default Home;
