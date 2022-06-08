
// In registration
const user = await Role({ value: 'USER' })
const admin = await Role({ value: 'ADMIN' })

await user.save()
await admin.save()

