function Profile({  name, message,avatar }) {

return(
    <div className="flex items-center gap-4 p-3 border rounded">
        <img src={avatar} alt={name} className="w-12 h-12 rounded-full" />
        <div>
            <h2 className="text-lg font-bold">{name}</h2>
            <p className="text-sm text-gray-600">{message}</p>
        </div>
        </div>

);

}
export default Profile;